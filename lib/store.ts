import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.menuId === item.menuId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.menuId === item.menuId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
              isCartOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
            isCartOpen: true,
          };
        });
      },

      removeItem: (menuId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menuId !== menuId),
        }));
      },

      updateQuantity: (menuId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuId === menuId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      getCartTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getCartCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'nanabites-cart',
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);
