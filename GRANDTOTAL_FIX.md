# 🔧 Grand Total Fix - Payment Page

## 🔴 MASALAH: Grand Total Tidak Berubah Saat Checkbox Di-Toggle

### **Gejala:**

- User klik checkbox untuk uncheck item
- Grand total tetap sama (tidak berkurang)
- Styling item berubah (opacity/background) tapi total tidak update

### **Root Cause:**

Dependency array di `grandTotal` useMemo hanya depend pada `watchedItems` reference:

```typescript
// ❌ SEBELUM (MASALAH)
const grandTotal = React.useMemo(() => {
  return watchedItems?.filter((item) => item.selected)?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? 0;
}, [watchedItems]); // ← watchedItems adalah array reference!
```

**Mengapa ini masalah?**

1. `watchedItems = watch("items")` mengembalikan **array reference**
2. Ketika checkbox di-toggle:
   - `setValue(`items.${index}.selected`, !currentSelected)` dipanggil
   - React Hook Form update form state
   - Tapi array reference **TETAP SAMA**
3. useMemo dependency tidak berubah → tidak re-compute
4. **Grand total tetap sama!**

### **Flow Masalah:**

```
User klik checkbox (uncheck item)
  ↓
toggleItemSelection(index) dipanggil
  ↓
setValue(`items.${index}.selected`, false)
  ↓
React Hook Form update form state
  ↓
watch("items") return array dengan item.selected = false
  ↓
TAPI array reference MASIH SAMA (object yang sama)
  ↓
useMemo dependency [watchedItems] tidak berubah
  ↓
useMemo tidak re-compute
  ↓
grandTotal tetap sama ❌
```

---

## ✅ SOLUSI: Depend pada Content, Bukan Reference

### **SETELAH (FIXED):**

```typescript
// ✅ SESUDAH (FIXED)
const grandTotal = React.useMemo(() => {
  return watchedItems?.filter((item) => item.selected)?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? 0;
}, [watchedItems?.map((item) => item.selected).join(","), watchedItems?.map((item) => item.subtotal).join(",")]);
```

**Mengapa ini bekerja?**

1. Dependency array sekarang depend pada **content**, bukan **reference**
2. `watchedItems?.map((item) => item.selected).join(",")` membuat string dari selected state
3. Ketika item.selected berubah → string berubah → dependency berubah
4. useMemo re-compute → grandTotal update ✅

### **Flow Setelah Fix:**

```
User klik checkbox (uncheck item)
  ↓
toggleItemSelection(index) dipanggil
  ↓
setValue(`items.${index}.selected`, false)
  ↓
React Hook Form update form state
  ↓
watch("items") return array dengan item.selected = false
  ↓
watchedItems?.map((item) => item.selected).join(",") = "true,false,true"
  ↓
Dependency string berubah dari "true,true,true" → "true,false,true"
  ↓
useMemo dependency berubah → RE-COMPUTE!
  ↓
grandTotal = 0 + 0 + 500000 = 500000 ✅
```

---

## 📊 Perbandingan

| Aspek                | Sebelum          | Sesudah                                   |
| -------------------- | ---------------- | ----------------------------------------- |
| Dependency           | `[watchedItems]` | `[watchedItems?.map(...).join(","), ...]` |
| Tipe Dependency      | Array reference  | String content                            |
| Saat Checkbox Toggle | Tidak re-compute | Re-compute ✅                             |
| Grand Total Update   | Tidak berubah ❌ | Berubah sesuai selection ✅               |

---

## 🧪 Testing

### Test Case 1: Uncheck Item

```
1. Dialog terbuka dengan 3 items (semua checked)
2. Grand Total = Rp 1.500.000
3. Uncheck item ke-2 (Rp 500.000)
4. Expected: Grand Total = Rp 1.000.000 ✅
5. Actual: Grand Total = Rp 1.000.000 ✅
```

### Test Case 2: Check Item Kembali

```
1. Item ke-2 unchecked, Grand Total = Rp 1.000.000
2. Check item ke-2 kembali
3. Expected: Grand Total = Rp 1.500.000 ✅
4. Actual: Grand Total = Rp 1.500.000 ✅
```

### Test Case 3: Uncheck Semua

```
1. Uncheck semua items
2. Expected: Grand Total = Rp 0 ✅
3. Expected: Submit button disabled ✅
4. Actual: Keduanya bekerja ✅
```

---

## 📝 Implementasi Detail

**File:** `/app/(frontend)/dashboard/bendahara/payment/page.tsx`

**Line:** 285-288

```typescript
// Compute grand total from selected items
const grandTotal = React.useMemo(() => {
  return watchedItems?.filter((item) => item.selected)?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? 0;
}, [watchedItems?.map((item) => item.selected).join(","), watchedItems?.map((item) => item.subtotal).join(",")]);
```

---

## 🎯 Key Takeaways

### ❌ **JANGAN:**

```typescript
// Depend pada array reference
const total = React.useMemo(() => {
  return array.reduce(...);
}, [array]);  // ← Array reference bisa tidak berubah!
```

### ✅ **LAKUKAN:**

```typescript
// Depend pada content
const total = React.useMemo(() => {
  return array.reduce(...);
}, [array?.map(item => item.value).join(",")]);  // ← Content-based dependency
```

---

## 🔗 Related Issues

- **Payment Page Grand Total:** Fixed ✅
- **Billing Page Grand Total:** Already implemented with same pattern ✅
- **Infinite Re-render:** Not affected (different issue)

---

## 📚 References

- [React useMemo Documentation](https://react.dev/reference/react/useMemo)
- [React Hook Form watch() Documentation](https://react-hook-form.com/api#watch)
- [Dependency Array Best Practices](https://react.dev/learn/lifecycle-of-reactive-effect#the-dependency-array)

---

**Status:** ✅ FIXED
**Date:** 2024
**Version:** 1.0.0
