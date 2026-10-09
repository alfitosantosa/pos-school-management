// ─── Payment Items Routine ────────────────────────────────────────────────────
// `payment_items_routine` holds payment items that are prepared up front and are
// turned into real payment items later — so there is no month, year, or payment
// status on this table yet.
// Prisma `Decimal` columns arrive over JSON as strings, hence `number | string`.
import type { PaymentTypeItemData } from "./payment-items-types";

export interface PaymentItemRoutineData {
  id: string;
  studentId: string;
  paymentTypeId: string;
  quantity: number | string;
  amount: number | string;
  subtotal: number | string;
  name: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Relations — API returns capital `PaymentType`, lowercase alias kept for parity
  PaymentType?: PaymentTypeItemData;
  paymentType?: PaymentTypeItemData;
  student?: PaymentItemRoutineStudent;
}

export interface PaymentItemRoutineStudent {
  id: string;
  name: string;
  nisn?: string | null;
  email?: string | null;
  class?: { name: string } | null;
  major?: { id: string; name: string } | null;
}

// ─── Input for create/update ──────────────────────────────────────────────────
export interface PaymentItemRoutineInput {
  id?: string;
  studentId: string;
  paymentTypeId: string;
  quantity?: number | string;
  amount?: number | string;
  subtotal?: number | string;
  name: string;
}

// ─── Bulk upload (Excel) ──────────────────────────────────────────────────────
export interface PaymentItemRoutineBulkPayload {
  studentId: string;
  paymentTypeId: string;
  quantity: number;
  amount: number;
  subtotal: number;
  name: string;
}

export interface PaymentItemRoutineBulkResult {
  message: string;
  count: number;
  skipped: number;
  total: number;
}
