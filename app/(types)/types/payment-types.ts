// Payment Types
export interface PaymentTypes {
  id: string;
  studentId: string;
  amount: number | string;
  dueDate?: Date | string | null;
  status?: string;
  notes?: string | null;
  createdAt?: Date | string;
  paymentDate: Date | string;
  receiptNumber: string;
  accountBankId: string;
  majorId: string;
  month: string;
  bendaharaId: string;
  bankRef?: string | null;
  transferDate?: Date | string | null;
  // Relations
  student?: StudentPaymentTypes;
  accountBank?: AccountBankTypes;
  major?: MajorPaymentTypes;
  createdBy?: BendaharaTypes;
  paymentItems?: PaymentItemTypes[];
  paymentTransaction?: PaymentTransactionTypes | null;
}

export interface PaymentTransactionTypes {
  id: string;
  paymentId: string;
  transactionId: string;
  orderId: string;
  grossAmount: number | string;
  paymentType: string;
  transactionTime: Date | string;
  transactionStatus: string;
  fraudStatus: string;
  finishRedirectUrl: string;
  createdAt?: Date | string;
  payment?: PaymentTypes;
}

// Minimal relation types
interface StudentPaymentTypes {
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

interface AccountBankTypes {
  id: string;
  accountName: string;
  accountBank: string;
  accountNumber: string;
  majorId: string;
}

interface MajorPaymentTypes {
  id: string;
  code: string;
  name: string;
}

interface BendaharaTypes {
  id: string;
  name: string;
  email?: string | null;
}

interface PaymentItemTypes {
  id: string;
  name: string;
  amount: number | string;
  subtotal: number | string;
  quantity: number | string;
  isPaid: boolean;
  month: string;
  year: string;
  skuType: string;
}
