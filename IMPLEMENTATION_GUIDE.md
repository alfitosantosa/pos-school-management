# Implementation Guide - Optimasi Performa Pos-Rahmany

## 🔧 IMPLEMENTASI KONKRET - SIAP COPY-PASTE

---

## Phase 1.1: Pagination Utility

**Buat file**: `lib/pagination.ts`

```typescript
import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export function extractPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResponse<T> {
  const pages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasMore: page < pages,
    },
  };
}

export function getPaginationQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return extractPaginationParams(searchParams);
}
```

---

## Phase 1.2: Refactor Payment API dengan Pagination

**File**: `/app/(backend)/api/payment/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaginationQuery, createPaginationResponse } from "@/lib/pagination";

// ✅ IMPROVED GET dengan pagination & field selection
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationQuery(request);

    // Gunakan select untuk mengambil hanya field yang dibutuhkan
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          dueDate: true,
          receiptNumber: true,
          month: true,
          bankRef: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              class: { select: { id: true, name: true } },
            },
          },
          major: {
            select: { id: true, name: true, code: true },
          },
          accountBank: {
            select: { id: true, bankName: true, accountNumber: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.payment.count(),
    ]);

    return NextResponse.json(createPaginationResponse(payments, total, page, limit));
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments", message: String(error) },
      { status: 500 }
    );
  }
}

// ✅ IMPROVED POST dengan validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, amount, dueDate, status, notes, paymentDate, receiptNumber, accountBankId, majorId, month, bendaharaId, bankRef } = body;

    // Validation
    if (!studentId || !amount || !receiptNumber || !accountBankId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newPayment = await prisma.payment.create({
      data: {
        studentId,
        bendaharaId,
        amount: parseFloat(String(amount)),
        accountBankId,
        bankRef,
        majorId,
        month,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: status || "pending",
        notes,
        paymentDate: new Date(paymentDate || Date.now()),
        receiptNumber,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        receiptNumber: true,
        student: { select: { id: true, name: true } },
        major: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment", message: String(error) },
      { status: 500 }
    );
  }
}

// ✅ IMPROVED PUT
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        ...updateData,
        amount: updateData.amount ? parseFloat(String(updateData.amount)) : undefined,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        paymentDate: updateData.paymentDate ? new Date(updateData.paymentDate) : undefined,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        student: { select: { id: true, name: true } },
        major: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment", message: String(error) },
      { status: 500 }
    );
  }
}

// ✅ DELETE dengan cascade handling
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Delete related records in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.deleteMany({ where: { paymentId: id } });
      await tx.paymentItems.deleteMany({ where: { paymentId: id } });
      return tx.payment.delete({ where: { id } });
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment", message: String(error) },
      { status: 500 }
    );
  }
}
```

---

## Phase 1.3: Update Prisma Schema dengan Indexes

**File**: `prisma/schema.prisma` (add ke models)

```prisma
// === ADD INDEXES ===

model UserData {
  // ... existing fields ...

  // Add at the end of model
  @@index([academicYearId])
  @@index([classId])
  @@index([majorId])
  @@index([roleId])
  @@index([userId])
  @@index([status])
  @@map("user_data")
}

model Schedule {
  // ... existing fields ...

  @@unique([classId, subjectId, teacherId, dayOfWeek, startTime])
  @@index([classId])
  @@index([subjectId])
  @@index([teacherId])
  @@index([academicYearId])
  @@index([dayOfWeek])
  @@map("schedules")
}

model Attendance {
  // ... existing fields ...

  @@unique([studentId, scheduleId, date])
  @@index([studentId])
  @@index([scheduleId])
  @@index([date])
  @@map("attendances")
}

model Payment {
  // ... existing fields ...

  @@index([studentId])
  @@index([majorId])
  @@index([status])
  @@index([createdAt])
  @@index([bendaharaId])
  @@map("payments")
}

model Grade {
  // ... existing fields ...

  @@index([studentId])
  @@index([scheduleId])
  @@index([academicYearId])
  @@map("grades")
}

model Violation {
  // ... existing fields ...

  @@index([studentId])
  @@index([violationTypeId])
  @@index([createdAt])
  @@map("violations")
}

model TahfidzRecord {
  // ... existing fields ...

  @@index([studentId])
  @@index([tahfidzGroupId])
  @@index([date])
  @@map("tahfidz_records")
}
```

**Run Migration**:
```bash
npx prisma migrate dev --name add_indexes
```

---

## Phase 2.1: Optimized React Query Provider

**File**: `app/client/providers.tsx`

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useMemo } from "react";

const isDev = process.env.NODE_ENV === "development";

// Define cache strategies
const CACHE_STRATEGIES = {
  // Static data yang jarang berubah (majors, roles, academic years)
  static: {
    staleTime: isDev ? 0 : 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2,            // 2 hours
  },
  // Dynamic data yang moderate update (payments, schedules)
  dynamic: {
    staleTime: 5 * 60 * 1000,              // 5 minutes
    gcTime: 30 * 60 * 1000,                // 30 minutes
  },
  // Real-time data yang sering berubah (live attendance, scores)
  realtime: {
    staleTime: 30 * 1000,                  // 30 seconds
    gcTime: 5 * 60 * 1000,                 // 5 minutes
  },
};

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default menggunakan dynamic strategy
            ...CACHE_STRATEGIES.dynamic,
            retry: 1, // Reduced from 2
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // Disable untuk mengurangi unnecessary requests
            refetchOnMount: "stale-while-revalidate", // Revalidate jika stale tapi return cached data
            refetchIntervalInBackground: false,
            networkMode: "always", // Retry even if offline
          },
          mutations: {
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Export untuk digunakan di hook level
export { CACHE_STRATEGIES };
```

---

## Phase 2.2: Optimized usePayment Hook

**File**: `app/(hooks)/hooks/Payments/usePayment.ts`

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { CACHE_STRATEGIES } from "@/app/client/providers";

// ✅ USE STATIC CACHE untuk list yang jarang berubah
export const useGetPayments = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ["payments", page, limit],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/payment", {
          params: { page: String(page), limit: String(limit) },
        });
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payments");
      }
    },
    ...CACHE_STRATEGIES.dynamic, // 5 min stale time
  });
};

// ✅ Mutation dengan optimistic updates
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/payment", data);
      return res.data;
    },
    onMutate: async (newPayment) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["payments"] });

      // Snapshot previous
      const previousPayments = queryClient.getQueryData(["payments"]);

      // Optimistic update
      queryClient.setQueryData(["payments"], (old: any) => ({
        ...old,
        data: [newPayment, ...(old?.data || [])],
      }));

      return { previousPayments };
    },
    onError: (err, newPayment, context: any) => {
      // Rollback
      queryClient.setQueryData(["payments"], context.previousPayments);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["payments"], refetchType: "stale" });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/payment", data);
      return res.data;
    },
    onSuccess: (updatedPayment) => {
      // Update specific payment query
      queryClient.setQueryData(["payment", updatedPayment.id], updatedPayment);
      queryClient.invalidateQueries({ queryKey: ["payments"], refetchType: "stale" });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/api/payment`, {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"], refetchType: "stale" });
    },
  });
};

// ✅ Specific payment dengan static cache
export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: async () => {
      const res = await apiGet(`/api/payment/${id}`);
      return res.data;
    },
    ...CACHE_STRATEGIES.dynamic,
    enabled: !!id,
  });
};
```

---

## Phase 3: Attendance API Refactor (Template)

**File**: `/app/(backend)/api/attendance/route.ts`

```typescript
"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaginationQuery, createPaginationResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationQuery(request);
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const studentId = searchParams.get("studentId");
    const scheduleId = searchParams.get("scheduleId");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build where clause
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (scheduleId) where.scheduleId = scheduleId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        select: {
          id: true,
          status: true,
          notes: true,
          date: true,
          createdAt: true,
          student: {
            select: { id: true, name: true, email: true },
          },
          schedule: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              class: { select: { id: true, name: true } },
              subject: { select: { id: true, name: true } },
              teacher: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json(createPaginationResponse(attendances, total, page, limit));
  } catch (error) {
    console.error("Error fetching attendances:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendances", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, scheduleId, status, notes, date } = await request.json();

    if (!studentId || !scheduleId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, scheduleId, status" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        scheduleId,
        status,
        notes,
        date: new Date(date || Date.now()),
      },
      select: {
        id: true,
        status: true,
        date: true,
        student: { select: { id: true, name: true } },
        schedule: { select: { id: true } },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Failed to create attendance", message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
      },
      select: {
        id: true,
        status: true,
        date: true,
        student: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance", message: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const attendance = await prisma.attendance.delete({
      where: { id },
      select: { id: true, date: true },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance", message: String(error) },
      { status: 500 }
    );
  }
}
```

---

## Testing Commands

```bash
# 1. Create migration untuk indexes
npx prisma migrate dev --name add_performance_indexes

# 2. Test API dengan pagination
curl "http://localhost:3000/api/payment?page=1&limit=20"

# 3. Verify indexes dibuat
psql -d your_db_name -c "\d+ payments"

# 4. Build & check bundle size
npm run build
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

---

## Monitoring & Verification

Tambah ke `next.config.ts` untuk monitor performance:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config ...
  
  // Enable optimized package imports
  experimental: {
    optimizePackageImports: [
      // ... existing packages ...
    ],
    // Monitor server actions perf
    instrumentationHook: true,
  },

  // Add performance headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Response-Time", value: "true" },
          { key: "Cache-Control", value: "public, s-maxage=10, stale-while-revalidate=59" },
        ],
      },
    ];
  },
};
```

---

**Total Effort Estimate**: 3-4 hari kerja  
**Expected Result**: 40-70% performa improvement
