// Payment Items Types
export interface PaymentItemsTypes {
  id: string;
  paymentId?: string | null;
  studentId: string;
  paymentTypeId: string;
  quantity: number | string;
  amount: number | string;
  subtotal: number | string;
  isPaid: boolean;
  month: string;
  name: string;
  year: string;
  skuType: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Relations
  student?: StudentItemTypes;
  payment?: PaymentItemPaymentTypes | null;
  PaymentType?: PaymentTypeItemTypes;
}

// Relation types
interface StudentItemTypes {
  id: string;
  name: string;
  email?: string | null;
  nisn?: string | null;
  class?: {
    id: string;
    name: string;
  } | null;
  major?: {
    id: string;
    name: string;
  } | null;
}

interface PaymentItemPaymentTypes {
  id: string;
  receiptNumber: string;
  status: string;
  accountBankId: string;
  paymentDate: Date | string;
  accountBank?: {
    id: string;
    accountName: string;
    accountBank: string;
    accountNumber: string;
  };
}

interface PaymentTypeItemTypes {
  id: string;
  name: string;
  description: string;
  amount: number | string;
  isMonthly: boolean;
  isActive: boolean;
  skuType: string;
  owner: string;
}

// Input types for API
export interface PaymentItemsInput {
  studentId: string;
  paymentTypeId: string;
  quantity: number;
  amount: number;
  subtotal: number;
  isPaid?: boolean;
  month: string;
  name: string;
  year: string;
  skuType: string;
}

// Filter types
export interface PaymentItemsFilterTypes {
  startDate?: Date | string;
  endDate?: Date | string;
  majorId?: string;
  status?: string;
  isPaid?: boolean;
  skuType?: string;
}
