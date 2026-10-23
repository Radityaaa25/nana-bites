"use client";

import {
  useCustomerOrderStore,
  type LocalOrder,
} from "@/lib/customerOrderStore";
import { useEffect } from "react";

export default function OrderSync({ order }: { order: LocalOrder }) {
  const upsertOrder = useCustomerOrderStore((state) => state.upsertOrder);

  useEffect(() => {
    upsertOrder(order);
  }, [order, upsertOrder]);

  return null;
}
