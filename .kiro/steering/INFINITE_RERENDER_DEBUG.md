# 🔴 DEBUGGING INFINITE RE-RENDER: Analisis Mendalam

## 📋 Executive Summary

Aplikasi Anda mengalami **infinite re-render loop** yang disebabkan oleh kombinasi:

1. **UUID generation di render** (Receipt Number)
2. **Object recreation pada setiap render** (userDataMajor)
3. **useEffect dependency issues** (reset function)
4. **React Query data reference changes**
5. **TanStack Table re-render traps**

---

## 🎯 AKAR MASALAH TEKNIKAL

### ❌ MASALAH #1: UUID Generated di Render (CRITICAL)

**File:** `payment/page.tsx` Line 520

```typescript
// ❌ MASALAH: UUID dibuat setiap render
<Input
  disabled={true}
  value={`KWT-${uuidv4().substring(0, 8).toUpperCase()}`}  // ← INFINITE LOOP!
  {...register("receiptNumber")}
/>
```

**Mengapa Loop Terjadi:**

```
Render 1: value = "KWT-ABC123"
  ↓
Render 2: value = "KWT-XYZ789" (berbeda!)
  ↓
Input value berubah → setState di form
  ↓
Re-render → UUID baru lagi
  ↓
INFINITE LOOP
```

**Flow Render:**

```
Component Render
  ↓
uuidv4() dipanggil → UUID baru
  ↓
Input value berubah
  ↓
React Hook Form detect perubahan
  ↓
setState di form
  ↓
Re-render
  ↓
uuidv4() dipanggil lagi → UUID BERBEDA
  ↓
LOOP!
```

---

### ❌ MASALAH #2: Object Prop Tidak Dimemoisasi

**File:** `payment/page.tsx` Line 1182

```typescript
// ❌ MASALAH: userDataMajor object dibuat setiap render di parent
<PaymentFormDialog
  userDataMajor={userDataMajor}  // ← Object baru setiap render!
/>
```

**Parent Component (PaymentPage):**

```typescript
const userDataMajor = userData?.major; // ← Ini object reference baru setiap render!
```

**Mengapa Loop Terjadi:**

```
Parent Render
  ↓
userDataMajor = userData?.major (object reference baru)
  ↓
Pass ke PaymentFormDialog
  ↓
PaymentFormDialog useEffect dependency: [userDataMajor]
  ↓
userDataMajor reference berubah → useEffect runs
  ↓
reset() dipanggil
  ↓
Form state berubah
  ↓
Parent re-render
  ↓
userDataMajor reference baru lagi
  ↓
LOOP!
```

---

### ❌ MASALAH #3: useEffect dengan Function Dependency

**File:** `payment/page.tsx` Line 281

```typescript
// ❌ MASALAH: reset function di dependency array
React.useEffect(() => {
  if (editData) {
    reset({...});
  }
}, [editData, userDataId, userDataMajorId]);  // ← reset dihapus, tapi masih ada issue
```

**Mengapa Masih Loop:**

- `userDataMajorId` bisa undefined/berubah
- Setiap kali berubah → useEffect runs
- reset() dipanggil → form state berubah
- Parent re-render → userDataMajorId reference baru

---

### ❌ MASALAH #4: React Query Data Reference Changes

**File:** `payment/page.tsx` Line 215

```typescript
// ❌ MASALAH: unpaidItemsData reference berubah setiap query
const { data: unpaidItemsData = [] } = usePaymentItemsUnpaidStudent(selectedStudentId, { enabled: !!selectedStudentId });

// useEffect dependency
React.useEffect(() => {
  if (unpaidItemsData?.length > 0) {
    replace(formattedItems); // ← Trigger re-render
  }
}, [unpaidItemsData]); // ← Reference baru setiap query!
```

**Flow:**

```
Query returns data
  ↓
unpaidItemsData reference baru (even if content sama)
  ↓
useEffect runs
  ↓
replace() dipanggil
  ↓
Form state berubah
  ↓
Component re-render
  ↓
Query runs lagi (karena selectedStudentId masih sama)
  ↓
unpaidItemsData reference baru lagi
  ↓
LOOP!
```

---

### ❌ MASALAH #5: TanStack Table globalFilterFn Recreation

**File:** `payment/page.tsx` Line 750

```typescript
// ❌ MASALAH: Function dibuat setiap render
const globalFilterFn = React.useCallback((row: any, _: string, filterValue: string) => {
  // ... logic
}, []); // ← Dependency array kosong, tapi function masih bisa berubah reference
```

**Mengapa Masalah:**

- Meskipun useCallback, jika parent re-render → child re-render
- TanStack Table detect function reference berubah
- Table re-render → trigger parent re-render
- LOOP!

---

## ✅ SOLUSI PRODUCTION-GRADE

### SOLUSI #1: Generate UUID di State, Bukan di Render

**BEFORE:**

```typescript
<Input
  disabled={true}
  value={`KWT-${uuidv4().substring(0, 8).toUpperCase()}`}
  {...register("receiptNumber")}
/>
```

**AFTER:**

```typescript
// Generate UUID sekali saat dialog dibuka
const [receiptNumber, setReceiptNumber] = React.useState<string>("");

React.useEffect(() => {
  if (open && !editData) {
    // Generate hanya saat dialog buka untuk create mode
    setReceiptNumber(`KWT-${uuidv4().substring(0, 8).toUpperCase()}`);
  } else if (editData) {
    // Gunakan receipt number dari editData
    setReceiptNumber(editData.receiptNumber);
  }
}, [open, editData]);

// Di form
<Input
  disabled={true}
  value={receiptNumber}
  {...register("receiptNumber")}
/>
```

---

### SOLUSI #2: Memoize Parent Props

**BEFORE (PaymentPage):**

```typescript
const userDataMajor = userData?.major;  // ← Object baru setiap render

return <PaymentDataTable userDataMajor={userDataMajor} />;
```

**AFTER:**

```typescript
// Memoize object agar reference stabil
const userDataMajor = React.useMemo(() => userData?.major, [userData?.id]);

return <PaymentDataTable userDataMajor={userDataMajor} />;
```

---

### SOLUSI #3: Optimize useEffect Dependencies

**BEFORE:**

```typescript
React.useEffect(() => {
  if (editData) {
    reset({...});
  }
}, [editData, userDataId, userDataMajorId]);
```

**AFTER:**

```typescript
// Hanya depend pada actual data changes, bukan object references
React.useEffect(() => {
  if (editData) {
    reset({...});
  }
}, [editData?.id, userDataId]);  // ← Gunakan ID, bukan object
```

---

### SOLUSI #4: Stabilize React Query Data

**BEFORE:**

```typescript
const { data: unpaidItemsData = [] } = usePaymentItemsUnpaidStudent(selectedStudentId, { enabled: !!selectedStudentId });

React.useEffect(() => {
  if (unpaidItemsData?.length > 0) {
    replace(formattedItems);
  }
}, [unpaidItemsData]); // ← Reference baru setiap query
```

**AFTER:**

```typescript
const { data: unpaidItemsData = [] } = usePaymentItemsUnpaidStudent(selectedStudentId, { enabled: !!selectedStudentId });

// Memoize data untuk stabilize reference
const memoizedUnpaidItems = React.useMemo(() => {
  return (
    unpaidItemsData?.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      quantity: item.quantity,
      subtotal: item.subtotal,
      month: item.month,
      year: item.year,
      selected: true,
    })) ?? []
  );
}, [unpaidItemsData?.length, unpaidItemsData?.[0]?.id]); // ← Depend pada content, bukan reference

React.useEffect(() => {
  if (memoizedUnpaidItems.length > 0) {
    replace(memoizedUnpaidItems);
    setUnpaidItems(unpaidItemsData);
  } else {
    replace([]);
    setUnpaidItems([]);
  }
}, [memoizedUnpaidItems.length]); // ← Depend pada length, bukan array reference
```

---

### SOLUSI #5: Memoize TanStack Table Functions

**BEFORE:**

```typescript
const globalFilterFn = React.useCallback((row: any, _: string, filterValue: string) => {
  // ...
}, []);
```

**AFTER:**

```typescript
// Memoize dengan proper dependencies
const globalFilterFn = React.useCallback((row: any, _: string, filterValue: string) => {
  if (!filterValue) return true;
  const p = row.original as PaymentData;
  const text = [p.student?.name, p.major?.name, p.accountBank?.accountName, p.accountBank?.accountBank, p.receiptNumber, p.month, p.status, p.notes].filter(Boolean).join(" ").toLowerCase();
  return text.includes(filterValue.toLowerCase());
}, []); // ← Aman karena tidak depend pada external state

// Memoize columns juga
const columns = React.useMemo(() => [...columnDefinitions], []);
```

---

## 🔧 REFACTORED CODE: PaymentFormDialog

```typescript
function PaymentFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
  allStudents,
  allAccountBanks,
  userDataId,
  userDataMajorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: PaymentData | null;
  onSuccess: () => void;
  allStudents: { id: string; name: string }[];
  allAccountBanks: {
    id: string;
    accountName: string;
    accountBank?: string;
    accountNumber: string;
    major: { name: string };
  }[];
  userDataId?: string;
  userDataMajorId?: string;
}) {
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const setPaidMutation = userPaymentItemsSetPaid();

  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("");
  const [unpaidItems, setUnpaidItems] = React.useState<PaymentItemData[]>([]);
  // ✅ FIX #1: Generate UUID di state, bukan di render
  const [receiptNumber, setReceiptNumber] = React.useState<string>("");

  // Fetch unpaid items when student is selected
  const { data: unpaidItemsData = [] } = usePaymentItemsUnpaidStudent(
    selectedStudentId,
    { enabled: !!selectedStudentId }
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema as any),
    defaultValues: {
      status: "pending",
      paymentDate: new Date().toISOString().split("T")[0],
      bendaharaId: userDataId || "",
      majorId: userDataMajorId || "",
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedStudentId = watch("studentId");

  // ✅ FIX #2: Generate receipt number sekali saat dialog buka
  React.useEffect(() => {
    if (open && !editData) {
      setReceiptNumber(`KWT-${uuidv4().substring(0, 8).toUpperCase()}`);
    } else if (editData) {
      setReceiptNumber(editData.receiptNumber);
    }
  }, [open, editData?.id]);  // ← Depend pada editData.id, bukan object

  // Load unpaid items when student changes
  React.useEffect(() => {
    if (watchedStudentId && watchedStudentId !== selectedStudentId) {
      setSelectedStudentId(watchedStudentId);
    }
  }, [watchedStudentId, selectedStudentId]);

  // ✅ FIX #3: Memoize unpaid items untuk stabilize reference
  const memoizedUnpaidItems = React.useMemo(() => {
    if (!unpaidItemsData?.length) return [];
    return unpaidItemsData.map((item: PaymentItemData) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      quantity: item.quantity,
      subtotal: item.subtotal,
      month: item.month,
      year: item.year,
      selected: true,
    }));
  }, [unpaidItemsData?.length, unpaidItemsData?.[0]?.id]);

  // Update form items when unpaid items are loaded
  React.useEffect(() => {
    if (memoizedUnpaidItems.length > 0) {
      replace(memoizedUnpaidItems);
      setUnpaidItems(unpaidItemsData);
    } else {
      replace([]);
      setUnpaidItems([]);
    }
  }, [memoizedUnpaidItems.length]);  // ← Depend pada length, bukan array reference

  // Compute grand total from selected items
  const grandTotal = React.useMemo(() => {
    return watchedItems?.filter((item) => item.selected)?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? 0;
  }, [watchedItems]);

  // Toggle item selection
  const toggleItemSelection = React.useCallback((index: number) => {
    const currentSelected = watchedItems[index].selected;
    setValue(`items.${index}.selected`, !currentSelected);
  }, [watchedItems, setValue]);

  // ✅ FIX #4: Optimize useEffect dependencies
  React.useEffect(() => {
    if (editData) {
      reset({
        studentId: editData.studentId || "",
        accountBankId: editData.accountBankId || "",
        month: editData.month || "",
        status: editData.status || "pending",
        paymentDate: editData.paymentDate ? new Date(editData.paymentDate).toISOString().split("T")[0] : "",
        dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().split("T")[0] : "",
        receiptNumber: editData.receiptNumber || "",
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
    } else {
      reset({
        status: "pending",
        paymentDate: new Date().toISOString().split("T")[0],
        bendaharaId: userDataId || "",
        majorId: userDataMajorId || "",
        items: [],
      });
      setSelectedStudentId("");
      setUnpaidItems([]);
    }
  }, [editData?.id, userDataId, userDataMajorId]);  // ← Depend pada ID, bukan object

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const selectedItems = data.items.filter((item) => item.selected);

      if (selectedItems.length === 0) {
        toast.error("Pilih minimal satu item pembayaran!");
        return;
      }

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
        notes: data.notes || null,
      };

      if (editData) {
        await updatePayment.mutateAsync({ id: editData.id, ...paymentPayload });
        const paymentItemsIds = selectedItems.map((item) => item.id);
        await setPaidMutation.mutateAsync({
          paymentItemsIds,
          paymentId: editData.id,
        });
        toast.success("Pembayaran berhasil diperbarui!");
      } else {
        const created = await createPayment.mutateAsync(paymentPayload);
        const newPaymentId = created?.id;

        if (newPaymentId) {
          const paymentItemsIds = selectedItems.map((item) => item.id);
          await setPaidMutation.mutateAsync({
            paymentItemsIds,
            paymentId: newPaymentId,
          });
        }
        toast.success("Pembayaran berhasil dibuat!");
      }

      reset();
      setSelectedStudentId("");
      setUnpaidItems([]);
      setReceiptNumber("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const isPending = createPayment.isPending || updatePayment.isPending || setPaidMutation.isPending;
  const selectedItemsCount = watchedItems?.filter((item) => item.selected)?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Pembayaran" : "Tambah Pembayaran Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("bendaharaId")} />
          <input type="hidden" {...register("majorId")} />

          {/* ... rest of form ... */}

          {/* ✅ FIX #1: Gunakan state receiptNumber */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Nomor Kwitansi</Label>
            <Input
              disabled={true}
              value={receiptNumber}
              id="receiptNumber"
              placeholder="Contoh: KWT-2024-001"
              {...register("receiptNumber")}
            />
            {errors.receiptNumber && <p className="text-sm text-red-500">{errors.receiptNumber.message}</p>}
          </div>

          {/* ... rest of form ... */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔧 REFACTORED CODE: PaymentPage (Parent)

```typescript
export default function PaymentPage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;
  const userDataId = userData?.id;

  // ✅ FIX #2: Memoize userDataMajor object
  const userDataMajor = React.useMemo(() => {
    return userData?.major ? { id: userData.major.id, name: userData.major.name } : { id: undefined, name: undefined };
  }, [userData?.major?.id, userData?.major?.name]);

  if (isPending || isLoadingUserData) {
    return <Loading />;
  }

  if (userRole !== "Admin" && userRole !== "Bendahara") {
    unauthorized();
    return null;
  }

  return <PaymentDataTable userDataId={userDataId} userDataMajor={userDataMajor} />;
}
```

---

## 📊 BEST PRACTICES: TanStack Table + RHF + React Query

### 1. **Dependency Array Rules**

```typescript
// ❌ JANGAN
useEffect(() => {
  // ...
}, [reset, replace, watch, setValue]); // Functions dari hooks

// ✅ LAKUKAN
useEffect(() => {
  // ...
}, [editData?.id, userDataId]); // Hanya data values
```

### 2. **Memoization Strategy**

```typescript
// ✅ Memoize objects yang di-pass sebagai props
const memoizedObject = React.useMemo(
  () => ({
    id: data?.id,
    name: data?.name,
  }),
  [data?.id, data?.name],
);

// ✅ Memoize functions yang di-pass sebagai props
const memoizedCallback = React.useCallback(() => {
  // ...
}, []); // Kosong jika tidak depend pada external state

// ✅ Memoize computed values
const computedValue = React.useMemo(() => {
  return data?.map((item) => item.value).reduce((a, b) => a + b, 0);
}, [data?.length]);
```

### 3. **React Query Data Handling**

```typescript
// ❌ JANGAN: Depend pada array reference
useEffect(() => {
  setItems(data);
}, [data]); // data reference baru setiap query

// ✅ LAKUKAN: Depend pada content, bukan reference
useEffect(() => {
  setItems(data);
}, [data?.length, data?.[0]?.id]); // Depend pada content
```

### 4. **TanStack Table Optimization**

```typescript
// ✅ Memoize columns
const columns = React.useMemo(
  () => [
    // column definitions
  ],
  [],
);

// ✅ Memoize filter functions
const globalFilterFn = React.useCallback((row, _, filterValue) => {
  // filter logic
}, []);

// ✅ Memoize table instance
const table = React.useMemo(
  () =>
    useReactTable({
      data,
      columns,
      // ...
    }),
  [data, columns],
);
```

---

## 🚀 CHECKLIST IMPLEMENTASI

- [ ] Generate UUID di state, bukan di render
- [ ] Memoize parent props (userDataMajor)
- [ ] Optimize useEffect dependencies (gunakan ID, bukan object)
- [ ] Stabilize React Query data (depend pada content)
- [ ] Memoize TanStack Table functions
- [ ] Memoize columns definition
- [ ] Remove functions dari dependency array
- [ ] Test dengan React DevTools Profiler
- [ ] Monitor re-renders dengan console.log
- [ ] Verify infinite loop sudah hilang

---

## 🧪 TESTING INFINITE LOOP

```typescript
// Tambahkan di component untuk debug
React.useEffect(() => {
  console.log("PaymentFormDialog rendered");
}, []);

React.useEffect(() => {
  console.log("useEffect 1 ran", { editData, userDataId, userDataMajorId });
}, [editData, userDataId, userDataMajorId]);

React.useEffect(() => {
  console.log("useEffect 2 ran", { unpaidItemsData });
}, [unpaidItemsData]);

// Gunakan React DevTools Profiler untuk lihat render count
```

---

## 📚 REFERENSI

- [React useCallback Documentation](https://react.dev/reference/react/useCallback)
- [React useMemo Documentation](https://react.dev/reference/react/useMemo)
- [React Hook Form Best Practices](https://react-hook-form.com/form-builder)
- [TanStack Table Performance](https://tanstack.com/table/v8/docs/guide/column-defs)
- [React Query Caching](https://tanstack.com/query/latest/docs/react/caching)
