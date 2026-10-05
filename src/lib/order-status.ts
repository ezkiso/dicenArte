import type { OrderStatus } from "@prisma/client";

export const ADMIN_ORDER_STATUS_OPTIONS = [
  "EN_PREPARACION",
  "ENVIADA",
  "ENTREGADA",
] as const;

const NEXT_ADMIN_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAGADA: "EN_PREPARACION",
  EN_PREPARACION: "ENVIADA",
  ENVIADA: "ENTREGADA",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente de pago",
  PAGADA: "Pagada",
  RECHAZADA: "Pago rechazado",
  EN_PREPARACION: "En preparación",
  ENVIADA: "Enviada",
  ENTREGADA: "Entregada",
  ANULADA: "Anulada",
};

export function getNextAdminOrderStatus(status: OrderStatus) {
  return NEXT_ADMIN_ORDER_STATUS[status] ?? null;
}
