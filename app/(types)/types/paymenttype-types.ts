// Payment Type Types
export interface PaymentTypeTypes {
  id: string;
  name: string;
  description: string;
  amount: number | string;
  isMonthly: boolean;
  isActive: boolean;
  isFixedAmount: boolean;
  isFixedQuantity: boolean;
  quantity: number;
  subtotal: number | string;
  owner: string;
  majorId: string;
  skuType: string;
  // Relations
  major?: MajorPaymentTypeTypes;
  paymentItems?: PaymentItemPaymentTypeTypes[];
}

interface MajorPaymentTypeTypes {
  id: string;
  code: string;
  name: string;
}

interface PaymentItemPaymentTypeTypes {
  id: string;
  name: string;
  amount: number | string;
  subtotal: number | string;
  isPaid: boolean;
}

// Input types
export interface PaymentTypeInput {
  name: string;
  description: string;
  amount: number;
  isMonthly?: boolean;
  isActive?: boolean;
  isFixedAmount: boolean;
  isFixedQuantity: boolean;
  quantity: number;
  subtotal: number;
  owner: string;
  majorId: string;
  skuType: string;
}
