import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let response = await api.get(`/stock/${productId}`);
      const productStock: Stock = response.data;
    
      let newCart: Product[] = [];
      const selectedProduct = cart.find(product => product.id === productId);

      if (selectedProduct) {
        // Produto já está no carrinho. Aumentar quantidade
        if (productStock.amount < selectedProduct.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        newCart = cart.map(product => product.id === productId ? {
          ...product,
          amount: product.amount + 1
        } : product);
      } else {
        // Produto não existe no carrinho. Deve ser adicionado agora
        if (productStock.amount < 1){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        response = await api.get(`/products/${productId}`);
        const newProduct = {
          ...response.data,
          amount: 1
        };
        newCart = [...cart, newProduct];
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      toast.success('Produto removido do carrinho');
    } catch {
      toast.error('Erro ao remover produto do carrinho');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      if (response.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(product => product.id === productId ? {
        ...product,
        amount: amount
      } : product);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
