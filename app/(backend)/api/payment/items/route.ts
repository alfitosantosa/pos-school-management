// model PaymentItems {
//   id            String      @id @default(uuid())
//   paymentId     String
//   studentId     String
//   studentName   String
//   paymentTypeId String
//   skuName       String
//   quantity      Int
//   amount        Int
//   subtotal      Int
//   payment       Payment     @relation(fields: [paymentId], references: [id])
//   PaymentType   PaymentType @relation(fields: [paymentTypeId], references: [id])
//   student       UserData    @relation(fields: [studentId], references: [id])

//   @@map("payment_items")
// }

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { paymentItems } = await request.json();

  const CreateInvoiceItems = await prisma.paymentItems.createMany({
    data: paymentItems.map(({ paymentItems, ...item }: any) => item),
  });

  return NextResponse.json(CreateInvoiceItems);
}