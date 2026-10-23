import type { PaymentStatus } from "@/lib/payment";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LocalOrderStatus = "pending" | "processing" | "completed";

export type LocalOrder = {
  id: string;
  createdAt: string;
  totalPrice: number;
  paymentMethod: "cash" | "qris" | string;
  paymentStatus: PaymentStatus;
  orderStatus: LocalOrderStatus;
  items: Array<{ name: string; quantity: number }>;
};

export type CustomerInfo = {
  name: string;
  phone: string;
};

interface CustomerOrderState {
  orders: LocalOrder[];
  customer: CustomerInfo | null;
  addOrder: (order: LocalOrder) => void;
  upsertOrder: (order: LocalOrder) => void;
  removeOrder: (id: string) => void;
  clearOrders: () => void;
  saveCustomer: (customer: CustomerInfo) => void;
}

const MAX_LOCAL_ORDERS = 50;

export const useCustomerOrderStore = create<CustomerOrderState>()(
  persist(
    (set) => ({
      orders: [],
      customer: null,

      addOrder: (order) => {
        set((state) => {
          const withoutDuplicate = state.orders.filter(
            (item) => item.id !== order.id,
          );
          return {
            orders: [order, ...withoutDuplicate].slice(0, MAX_LOCAL_ORDERS),
          };
        });
      },

      upsertOrder: (order) => {
        set((state) => {
          const existing = state.orders.find((item) => item.id === order.id);
          if (existing) {
            return {
              orders: state.orders.map((item) =>
                item.id === order.id ? { ...item, ...order } : item,
              ),
            };
          }
          return {
            orders: [order, ...state.orders].slice(0, MAX_LOCAL_ORDERS),
          };
        });
      },

      removeOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((item) => item.id !== id),
        }));
      },

      clearOrders: () => set({ orders: [] }),

      saveCustomer: (customer) => set({ customer }),
    }),
    {
      name: "nanabites-orders-v1",
      version: 1,
      partialize: (state) => ({
        orders: state.orders,
        customer: state.customer,
      }),
    },
  ),
);
