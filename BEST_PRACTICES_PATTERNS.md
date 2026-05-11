# 🎯 BEST PRACTICES & PATTERNS: RHF + TanStack Table + React Query

## 📚 TABLE OF CONTENTS

1. [Dependency Array Patterns](#dependency-array-patterns)
2. [Memoization Strategies](#memoization-strategies)
3. [React Hook Form Patterns](#react-hook-form-patterns)
4. [React Query Patterns](#react-query-patterns)
5. [TanStack Table Patterns](#tanstack-table-patterns)
6. [Common Pitfalls](#common-pitfalls)
7. [Performance Optimization](#performance-optimization)

---

## 🔗 Dependency Array Patterns

### Pattern 1: Primitive Values Only

```typescript
// ✅ GOOD: Depend pada primitive values
const [count, setCount] = React.useState(0);
const [name, setName] = React.useState("");

React.useEffect(() => {
  console.log("Count or name changed");
}, [count, name]); // ← Primitives are safe
```

### Pattern 2: Object IDs Instead of Objects

```typescript
// ❌ BAD: Object reference berubah setiap render
const user = { id: "123", name: "John" };
React.useEffect(() => {
  // ...
}, [user]); // ← Object reference baru setiap render

// ✅ GOOD: Depend pada ID
React.useEffect(() => {
  // ...
}, [user?.id]); // ← Primitive value
```

### Pattern 3: Nested Object Properties

```typescript
// ❌ BAD: Depend pada nested object
const data = { user: { profile: { name: "John" } } };
React.useEffect(() => {
  // ...
}, [data.user.profile]); // ← Reference baru setiap render

// ✅ GOOD: Depend pada leaf value
React.useEffect(() => {
  // ...
}, [data?.user?.profile?.name]); // ← Primitive value
```

### Pattern 4: Array Length Instead of Array

```typescript
// ❌ BAD: Array reference berubah
const items = [1, 2, 3];
React.useEffect(() => {
  // ...
}, [items]); // ← Reference baru setiap render

// ✅ GOOD: Depend pada length dan first item
React.useEffect(() => {
  // ...
}, [items?.length, items?.[0]?.id]); // ← Primitives
```

---

## 💾 Memoization Strategies

### Strategy 1: Memoize Objects

```typescript
// ❌ BAD: Object dibuat setiap render
function Parent() {
  const config = { theme: "dark", size: "large" };
  return <Child config={config} />;
}

// ✅ GOOD: Memoize object
function Parent() {
  const config = React.useMemo(() => ({
    theme: "dark",
    size: "large",
  }), []);  // ← Depend pada constants

  return <Child config={config} />;
}
```

### Strategy 2: Memoize Functions

```typescript
// ❌ BAD: Function dibuat setiap render
function Parent() {
  const handleClick = () => {
    console.log("clicked");
  };
  return <Child onClick={handleClick} />;
}

// ✅ GOOD: Memoize function
function Parent() {
  const handleClick = React.useCallback(() => {
    console.log("clicked");
  }, []);  // ← No dependencies

  return <Child onClick={handleClick} />;
}
```

### Strategy 3: Memoize Computed Values

```typescript
// ❌ BAD: Computed setiap render
function Parent({ items }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <Child total={total} />;
}

// ✅ GOOD: Memoize computed value
function Parent({ items }) {
  const total = React.useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items?.length, items?.[0]?.id]);  // ← Depend pada content

  return <Child total={total} />;
}
```

### Strategy 4: Memoize Derived State

```typescript
// ❌ BAD: Derived state di state
function Component({ data }) {
  const [filtered, setFiltered] = React.useState([]);

  React.useEffect(() => {
    setFiltered(data.filter((item) => item.active));
  }, [data]); // ← Trigger setiap data berubah
}

// ✅ GOOD: Memoize derived state
function Component({ data }) {
  const filtered = React.useMemo(() => {
    return data.filter((item) => item.active);
  }, [data?.length, data?.[0]?.id]); // ← Depend pada content
}
```

---

## 📝 React Hook Form Patterns

### Pattern 1: Controlled Form with RHF

```typescript
// ✅ GOOD: RHF handles form state
function MyForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name", { required: true })} />
      {errors.name && <span>Required</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Pattern 2: Dynamic Fields with useFieldArray

```typescript
// ✅ GOOD: useFieldArray untuk dynamic fields
function DynamicForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      items: [{ name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`items.${index}.name`)} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ name: "" })}>Add</button>
    </form>
  );
}
```

### Pattern 3: Form Reset with Memoized Data

```typescript
// ✅ GOOD: Reset form dengan memoized data
function EditForm({ editData }) {
  const { reset, formState: { isDirty } } = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Memoize edit data untuk stabilize reference
  const memoizedEditData = React.useMemo(() => ({
    name: editData?.name || "",
    email: editData?.email || "",
  }), [editData?.id]);

  React.useEffect(() => {
    reset(memoizedEditData);
  }, [memoizedEditData, reset]);

  return (
    <form>
      {/* form fields */}
    </form>
  );
}
```

### Pattern 4: Watch Specific Fields

```typescript
// ✅ GOOD: Watch specific fields, bukan semua
function ConditionalForm() {
  const { register, watch } = useForm();

  // Hanya watch field yang dibutuhkan
  const userType = watch("userType");

  return (
    <form>
      <select {...register("userType")}>
        <option value="individual">Individual</option>
        <option value="company">Company</option>
      </select>

      {userType === "company" && (
        <input {...register("companyName")} />
      )}
    </form>
  );
}
```

---

## 🔄 React Query Patterns

### Pattern 1: Stable Query Keys

```typescript
// ✅ GOOD: Stable query keys
const queryKey = ["payments", userId, { status: "paid" }];

const { data } = useQuery({
  queryKey,
  queryFn: () => fetchPayments(userId, "paid"),
});
```

### Pattern 2: Dependent Queries

```typescript
// ✅ GOOD: Dependent queries dengan enabled
function PaymentDetails({ paymentId }) {
  // Query 1: Fetch payment
  const { data: payment } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => fetchPayment(paymentId),
  });

  // Query 2: Fetch items (depend pada payment)
  const { data: items } = useQuery({
    queryKey: ["paymentItems", payment?.id],
    queryFn: () => fetchPaymentItems(payment.id),
    enabled: !!payment?.id,  // ← Hanya run saat payment ada
  });

  return (
    <div>
      {/* render */}
    </div>
  );
}
```

### Pattern 3: Memoize Query Results

```typescript
// ✅ GOOD: Memoize query results untuk stabilize reference
function PaymentList() {
  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  // Memoize untuk stabilize reference
  const memoizedPayments = React.useMemo(() => {
    return payments.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
    }));
  }, [payments?.length, payments?.[0]?.id]);

  return (
    <div>
      {memoizedPayments.map(p => (
        <div key={p.id}>{p.amount}</div>
      ))}
    </div>
  );
}
```

### Pattern 4: Invalidate Queries After Mutation

```typescript
// ✅ GOOD: Invalidate related queries
function CreatePayment() {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });

  return (
    <button onClick={() => mutate(data)}>
      Create Payment
    </button>
  );
}
```

---

## 📊 TanStack Table Patterns

### Pattern 1: Memoize Columns

```typescript
// ✅ GOOD: Memoize columns definition
function DataTable({ data }) {
  const columns = React.useMemo(() => [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
  ], []);  // ← Depend pada constants

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      {/* render table */}
    </table>
  );
}
```

### Pattern 2: Memoize Filter Functions

```typescript
// ✅ GOOD: Memoize filter functions
function DataTable({ data }) {
  const globalFilterFn = React.useCallback((row, _, filterValue) => {
    if (!filterValue) return true;
    const text = Object.values(row.original).join(" ").toLowerCase();
    return text.includes(filterValue.toLowerCase());
  }, []);  // ← No dependencies

  const table = useReactTable({
    data,
    columns,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      {/* render table */}
    </table>
  );
}
```

### Pattern 3: Memoize Table Instance

```typescript
// ✅ GOOD: Memoize table instance
function DataTable({ data, columns }) {
  const table = React.useMemo(() =>
    useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    }),
    [data?.length, columns.length]
  );

  return (
    <table>
      {/* render table */}
    </table>
  );
}
```

### Pattern 4: Separate Sorting State

```typescript
// ✅ GOOD: Manage sorting state separately
function DataTable({ data, columns }) {
  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      {/* render table */}
    </table>
  );
}
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Creating Objects in Render

```typescript
// ❌ BAD: Object dibuat setiap render
function Component() {
  const config = { theme: "dark" };  // ← Baru setiap render
  return <Child config={config} />;
}

// ✅ GOOD: Memoize atau move outside
const config = { theme: "dark" };  // ← Constant

function Component() {
  return <Child config={config} />;
}
```

### Pitfall 2: Functions in Dependency Array

```typescript
// ❌ BAD: Function di dependency array
React.useEffect(() => {
  // ...
}, [reset, replace, setValue]); // ← Functions dari hooks

// ✅ GOOD: Hanya data di dependency array
React.useEffect(() => {
  // ...
}, [editData?.id, userDataId]); // ← Data values
```

### Pitfall 3: Unnecessary State Updates

```typescript
// ❌ BAD: Update state setiap render
function Component({ data }) {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    setItems(data); // ← Trigger setiap data berubah
  }, [data]);
}

// ✅ GOOD: Gunakan memoization
function Component({ data }) {
  const items = React.useMemo(() => data, [data?.length]);
}
```

### Pitfall 4: Infinite Loop dari UUID

```typescript
// ❌ BAD: UUID dibuat setiap render
<Input value={`ID-${uuidv4()}`} />  // ← Infinite loop!

// ✅ GOOD: Generate UUID di state
const [id, setId] = React.useState("");
React.useEffect(() => {
  setId(`ID-${uuidv4()}`);
}, []);

<Input value={id} />
```

---

## 🚀 Performance Optimization

### Optimization 1: Code Splitting

```typescript
// ✅ GOOD: Lazy load components
const PaymentForm = React.lazy(() => import("./PaymentForm"));

function App() {
  return (
    <React.Suspense fallback={<Loading />}>
      <PaymentForm />
    </React.Suspense>
  );
}
```

### Optimization 2: Virtual Scrolling

```typescript
// ✅ GOOD: Virtual scroll untuk large lists
import { FixedSizeList } from "react-window";

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Optimization 3: Debounce Search

```typescript
// ✅ GOOD: Debounce search input
function SearchPayments() {
  const [search, setSearch] = React.useState("");

  const debouncedSearch = React.useMemo(
    () => debounce((value) => {
      // Fetch payments
    }, 300),
    []
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input onChange={handleSearch} />;
}
```

### Optimization 4: Pagination

```typescript
// ✅ GOOD: Paginate large datasets
function PaymentTable() {
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const { data: payments } = useQuery({
    queryKey: ["payments", page],
    queryFn: () => fetchPayments(page, pageSize),
  });

  return (
    <div>
      {/* render table */}
      <button onClick={() => setPage(p => p - 1)}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

---

## 📋 CHECKLIST: Sebelum Deploy

- [ ] Tidak ada "Maximum update depth exceeded" error
- [ ] Render count stabil (gunakan Profiler)
- [ ] Dependency arrays benar
- [ ] Objects/functions dimemoisasi
- [ ] React Query queries optimal
- [ ] TanStack Table columns dimemoisasi
- [ ] No console warnings
- [ ] Performance acceptable (< 100ms render)
- [ ] Memory usage reasonable
- [ ] All features working correctly

---

**Last Updated:** 2024
**Version:** 1.0.0
