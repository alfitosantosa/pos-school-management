# Payment Logic Analysis: Create, Edit, Delete & Submit

## Overview

This document provides a comprehensive analysis of the payment submission flow in the bendahara (treasurer) payment management system.

---

## 1. CREATE PAYMENT FLOW

### 1.1 Frontend Flow (PaymentFormDialog)

**Trigger:** User clicks "Tambah Pembayaran" button

**Steps:**

1. **Dialog Opens**
   - Receipt number generated: `KWT-${uuidv4().substring(0, 8).toUpperCase()}`
   - Form resets with default values:
     - `status: "pending"`
     - `paymentDate: today's date`
     - `bendaharaId: userDataId` (current user)
     - `majorId: userDataMajorId` (user's major)
     - `items: []`

2. **Student Selection**
   - User selects a student from dropdown
   - Triggers `usePaymentItemsUnpaidStudent(selectedStudentId)` hook
   - Fetches unpaid payment items for that student

3. **Unpaid Items Display**
   - Items are displayed in a checklist format
   - Each item shows:
     - Payment type name
     - Month/Year
     - Amount (Rp)
     - Quantity
     - Subtotal
   - User can select/deselect items via checkboxes

4. **Form Submission**
   ```typescript
   const onSubmit = async (data: PaymentFormValues) => {
     // Filter only selected items
     const selectedItems = data.items.filter((item) => item.selected);

     // Calculate grand total from selected items
     const grandTotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

     // Create payment payload
     const paymentPayload = {
       studentId: data.studentId,
       bendaharaId: data.bendaharaId,
       majorId: data.majorId,
       accountBankId: data.accountBankId,
       month: data.month,
       amount: grandTotal,
       status: data.status,
       paymentDate: new Date(data.paymentDate).toISOString(),
       dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
       receiptNumber: data.receiptNumber,
       bankRef: data.bankRef,
       notes: data.notes || null,
     };

     // Create payment
     const created = await createPayment.mutateAsync(paymentPayload);
     const newPaymentId = created?.id;

     // Mark payment items as paid
     if (newPaymentId) {
       const paymentItemsIds = selectedItems.map((item) => item.id);
       await setPaidMutation.mutateAsync({
         paymentItemsIds,
         paymentId: newPaymentId,
       });
     }
   };
   ```

### 1.2 Backend Flow (POST /api/payment)

**Endpoint:** `POST /api/payment`

**Request Body:**

```typescript
{
  studentId: string,
  bendaharaId: string,
  majorId: string,
  accountBankId: string,
  month: string,
  amount: number,
  status: string,
  paymentDate: ISO string,
  dueDate?: ISO string,
  receiptNumber: string,
  bankRef: string,
  notes?: string
}
```

**Database Operation:**

```typescript
const newPayment = await prisma.payment.create({
  data: {
    studentId,
    bendaharaId,
    amount: parseFloat(amount),
    accountBankId,
    bankRef,
    majorId,
    month,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status,
    notes,
    paymentDate: new Date(paymentDate),
    receiptNumber,
  },
  include: {
    createdBy: true,
    student: true,
    major: true,
    accountBank: true,
  },
});
```

**Response:** Returns created payment object with relations

### 1.3 Mark Items as Paid (POST /api/payment/items/setpaid)

**Endpoint:** `POST /api/payment/items/setpaid`

**Request Body:**

```typescript
{
  paymentItemsIds: string[],
  paymentId: string
}
```

**Database Operation:**

```typescript
const result = await prisma.paymentItems.updateMany({
  where: {
    id: {
      in: paymentItemsIds,
    },
  },
  data: {
    paymentId: paymentId,
    isPaid: true,
  },
});
```

**Response:** Returns count of updated items

### 1.4 Query Invalidation (React Query)

After successful creation:

```typescript
queryClient.invalidateQueries({ queryKey: ["payments"] });
queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
queryClient.invalidateQueries({ queryKey: ["payment-by-id-major"] });
```

---

## 2. EDIT PAYMENT FLOW

### 2.1 Frontend Flow (PaymentFormDialog - Edit Mode)

**Trigger:** User clicks "Edit" from dropdown menu

**Steps:**

1. **Dialog Opens with Edit Data**
   - `editData` prop is passed to PaymentFormDialog
   - Form is populated with existing payment data:
     ```typescript
     reset({
       studentId: editData.studentId || "",
       accountBankId: editData.accountBankId || "",
       month: editData.month || "",
       status: editData.status || "pending",
       paymentDate: editData.paymentDate ? new Date(editData.paymentDate).toISOString().split("T")[0] : "",
       dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().split("T")[0] : "",
       receiptNumber: editData.receiptNumber || "",
       bankRef: editData.bankRef || "",
       notes: editData.notes || "",
       bendaharaId: userDataId || "",
       majorId: userDataMajorId || "",
       items:
         editData.paymentItems?.length ?
           editData.paymentItems.map((item) => ({
             id: item.id,
             name: item.name,
             amount: item.amount,
             quantity: item.quantity,
             subtotal: item.subtotal,
             month: item.month,
             year: item.year,
             selected: true,
           }))
         : [],
     });
     ```

2. **Student Selection Disabled**
   - Student field is disabled: `disabled={!!editData}`
   - Prevents changing student after payment creation

3. **Payment Items**
   - Existing payment items are displayed
   - User can select/deselect items
   - Receipt number and bank ref are pre-filled

4. **Form Submission (Edit)**
   ```typescript
   if (editData) {
     // Update existing payment
     await updatePayment.mutateAsync({ id: editData.id, ...paymentPayload });

     // Update payment items to isPaid: true with new paymentId
     const paymentItemsIds = selectedItems.map((item) => item.id);
     await setPaidMutation.mutateAsync({
       paymentItemsIds,
       paymentId: editData.id,
     });
   }
   ```

### 2.2 Backend Flow (PUT /api/payment)

**Endpoint:** `PUT /api/payment`

**Request Body:**

```typescript
{
  id: string,
  studentId: string,
  amount: number,
  dueDate?: ISO string,
  status: string,
  notes?: string,
  paymentDate: ISO string,
  receiptNumber: string,
  accountBankId: string,
  majorId: string,
  month: string
}
```

**Database Operation:**

```typescript
const updatedPayment = await prisma.payment.update({
  where: { id },
  data: {
    studentId,
    majorId,
    accountBankId,
    month,
    amount: parseFloat(amount),
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status,
    notes,
    paymentDate: new Date(paymentDate),
    receiptNumber,
  },
  include: {
    student: true,
    major: true,
    accountBank: true,
  },
});
```

**Response:** Returns updated payment object

### 2.3 Query Invalidation

Same as create flow:

```typescript
queryClient.invalidateQueries({ queryKey: ["payments"] });
queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
queryClient.invalidateQueries({ queryKey: ["payment-by-id-major"] });
```

---

## 3. DELETE PAYMENT FLOW

### 3.1 Frontend Flow (DeletePaymentDialog)

**Trigger:** User clicks "Hapus" from dropdown menu

**Steps:**

1. **Confirmation Dialog**
   - Shows payment receipt number and student name
   - Asks for confirmation before deletion

2. **Delete Handler**
   ```typescript
   const handleDelete = async () => {
     if (!paymentData) return;
     try {
       await deletePayment.mutateAsync(paymentData.id);
       toast.success("Pembayaran berhasil dihapus!");
       onOpenChange(false);
       onSuccess();
     } catch (error: any) {
       toast.error(error.message || "Gagal menghapus pembayaran");
     }
   };
   ```

### 3.2 Backend Flow (DELETE /api/payment)

**Endpoint:** `DELETE /api/payment`

**Request Body:**

```typescript
{
  id: string;
}
```

**Database Operations (Cascading Delete):**

```typescript
// 1. Delete payment transactions
await prisma.paymentTransaction.deleteMany({
  where: { paymentId: id },
});

// 2. Delete all payment items associated with this payment
await prisma.paymentItems.deleteMany({
  where: { paymentId: id },
});

// 3. Delete the payment
const deletedPayment = await prisma.payment.delete({
  where: { id },
});
```

**Response:** Returns deleted payment object

### 3.3 Query Invalidation

```typescript
queryClient.invalidateQueries({ queryKey: ["payments"] });
```

---

## 4. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT MANAGEMENT FLOW                       │
└─────────────────────────────────────────────────────────────────┘

CREATE FLOW:
┌──────────────────┐
│ User clicks      │
│ "Tambah Pembayaran"
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ PaymentFormDialog opens                  │
│ - Generate receipt number (UUID)         │
│ - Set default values                     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User selects student                     │
│ - Fetch unpaid items for student         │
│ - Display items in checklist             │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User selects items & fills form          │
│ - Select payment items                   │
│ - Fill payment date, bank ref, etc       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User submits form                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Frontend: Calculate grand total          │
│ - Sum selected items subtotal            │
│ - Create payment payload                 │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/payment                        │
│ - Create payment record                  │
│ - Return payment ID                      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/payment/items/setpaid          │
│ - Mark selected items as paid            │
│ - Link items to payment ID               │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Invalidate React Query caches            │
│ - payments                               │
│ - unpaid-students                        │
│ - payment-by-id-major                    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Close dialog & show success toast        │
│ - Refetch payment list                   │
└──────────────────────────────────────────┘

EDIT FLOW:
┌──────────────────┐
│ User clicks      │
│ "Edit"           │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ PaymentFormDialog opens with editData    │
│ - Populate form with existing data       │
│ - Disable student selection              │
│ - Load existing payment items            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User modifies form                       │
│ - Change status, dates, items, etc       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User submits form                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ PUT /api/payment                         │
│ - Update payment record                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/payment/items/setpaid          │
│ - Update selected items as paid          │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Invalidate React Query caches            │
│ - payments                               │
│ - unpaid-students                        │
│ - payment-by-id-major                    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Close dialog & show success toast        │
│ - Refetch payment list                   │
└──────────────────────────────────────────┘

DELETE FLOW:
┌──────────────────┐
│ User clicks      │
│ "Hapus"          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ DeletePaymentDialog shows confirmation   │
│ - Display receipt number & student name  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User confirms deletion                   │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ DELETE /api/payment                      │
│ - Delete payment transactions (cascade)  │
│ - Delete payment items (cascade)         │
│ - Delete payment record                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Invalidate React Query caches            │
│ - payments                               │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Close dialog & show success toast        │
│ - Refetch payment list                   │
└──────────────────────────────────────────┘
```

---

## 5. KEY VALIDATIONS

### Frontend Validations (Zod Schema)

```typescript
const paymentSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  bendaharaId: z.string().min(1, "Bendahara ID wajib diisi"),
  majorId: z.string().min(1, "Branch wajib dipilih"),
  accountBankId: z.string().min(1, "Rekening bank wajib dipilih"),
  month: z.string().min(1, "Bulan wajib dipilih"),
  status: z.string().min(1, "Status wajib dipilih"),
  paymentDate: z.string().min(1, "Tanggal bayar wajib diisi"),
  dueDate: z.string().optional(),
  receiptNumber: z.string().min(1, "Nomor kwitansi wajib diisi"),
  bankRef: z.string().min(1, "Masukan Ref Bank"),
  notes: z.string().optional(),
  items: z.array(paymentItemSchema).min(1, "Minimal satu item pembayaran harus dipilih"),
});
```

### Backend Validations

- **setpaid endpoint:**
  - `paymentItemsIds` must be non-empty array
  - `paymentId` must be provided

- **delete endpoint:**
  - `id` must be provided
  - Cascading deletes ensure referential integrity

---

## 6. DATABASE SCHEMA RELATIONSHIPS

```
Payment (1) ──────────────── (Many) PaymentItems
  │
  ├─ studentId ──────────────── UserData
  ├─ bendaharaId ────────────── UserData (CreatedPayment)
  ├─ majorId ────────────────── Major
  ├─ accountBankId ──────────── AccountBank
  └─ paymentItems ───────────── PaymentItems[]

PaymentItems (Many) ──────────── (1) Payment
  │
  ├─ studentId ──────────────── UserData
  ├─ paymentTypeId ──────────── PaymentType
  └─ paymentId ──────────────── Payment
```

---

## 7. IMPORTANT NOTES

### Receipt Number Generation

- Generated as UUID format: `KWT-${uuidv4().substring(0, 8).toUpperCase()}`
- Generated once when dialog opens (not on every render)
- Must be unique in database (enforced by schema)

### Payment Items Selection

- Only selected items (where `selected: true`) are marked as paid
- Grand total is calculated from selected items only
- Unselected items remain unpaid and available for future payments

### Edit Restrictions

- Student cannot be changed after payment creation
- Receipt number is pre-filled and cannot be changed
- Bank ref can be modified

### Cascading Deletes

- Deleting a payment also deletes:
  1. Associated PaymentTransaction records
  2. Associated PaymentItems records
  3. The Payment record itself

### Query Invalidation Strategy

- Uses React Query's `invalidateQueries` to refresh data
- Invalidates multiple related queries to ensure consistency
- Triggers automatic refetch of affected data

---

## 8. ERROR HANDLING

### Frontend Error Handling

- Form validation errors displayed inline
- Toast notifications for success/error messages
- Try-catch blocks in submit handlers
- Disabled submit button during mutation

### Backend Error Handling

- Try-catch blocks in all endpoints
- Returns appropriate HTTP status codes
- Error messages included in response
- Console logging for debugging

---

## 9. PERFORMANCE OPTIMIZATIONS

### Frontend Optimizations

1. **Memoization:**
   - `memoizedUnpaidItems` - prevents unnecessary re-renders
   - `userDataMajor` - stabilizes object reference
   - `grandTotal` - computed only when items change

2. **Lazy Loading:**
   - Unpaid items fetched only when student is selected
   - Query enabled conditionally: `enabled: !!selectedStudentId`

3. **Pagination:**
   - Table uses React Table pagination
   - Reduces DOM nodes for large datasets

### Backend Optimizations

1. **Database Queries:**
   - Uses `include` for eager loading relations
   - `updateMany` for batch operations
   - `deleteMany` for cascading deletes

2. **Indexing:**
   - Recommend indexes on:
     - `Payment.studentId`
     - `Payment.majorId`
     - `Payment.receiptNumber` (unique)
     - `PaymentItems.paymentId`
     - `PaymentItems.studentId`

---

## 10. TESTING CHECKLIST

- [ ] Create payment with single item
- [ ] Create payment with multiple items
- [ ] Create payment with all optional fields
- [ ] Edit payment and change status
- [ ] Edit payment and change items selection
- [ ] Delete payment and verify cascading delete
- [ ] Verify receipt number uniqueness
- [ ] Verify unpaid items fetch correctly
- [ ] Verify grand total calculation
- [ ] Verify query invalidation and refetch
- [ ] Test with different user roles (Admin, Bendahara)
- [ ] Test error scenarios (network failure, validation errors)
- [ ] Verify payment items marked as paid correctly
- [ ] Verify student selection disabled in edit mode
