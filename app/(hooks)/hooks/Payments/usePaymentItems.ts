"use client";
import { PaymentData, PaymentItemData, PaymentItemsInput, SetPaidInput } from "@/app/(types)";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetPaymentsItems = () => {
  return useQuery({
    queryKey: ["paymentItems"],
    queryFn: async () => {
      const res = await apiGet<PaymentItemData[]>("/api/payment/items");
      return res.data;
    },
  });
};

export const useCreatePaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemsInput) => {
      const res = await apiPost<PaymentItemData>("/api/payment/items", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
    },
  });
};

export const useUpdatePaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemData) => {
      const res = await apiPut("/api/payment/items", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
    },
  });
};

export const useDeletePaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | string[]) => {
      const response = await apiDelete(`/api/payment/items`, {
        body: JSON.stringify(Array.isArray(id) ? { ids: id } : { id }),
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
    },
  });
};

export const useCreatePaymentItemsBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemsInput[]) => {
      const res = await apiPost("/api/payment/items/student/bulk", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
      queryClient.invalidateQueries({ queryKey: ["payment-by-id-major"] });
    },
  });
};

export const useGetPaymentItemsById = (id: string) => {
  return useQuery({
    queryKey: ["paymentItems", id],
    queryFn: async () => {
      const res = await apiGet<PaymentItemData>(`/api/payment/items/${id}`);
      return res.data;
    },
  });
};

export const useGetPaymentByStudentId = (studentId: string) => {
  return useQuery({
    queryKey: ["payment-by-id", studentId],
    queryFn: async () => {
      const res = await apiGet<PaymentData[]>(`/api/payment/student/${studentId}`);
      return res.data;
    },
    enabled: !!studentId,
  });
};

export const usePaymentItemsUnpaidStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["unpaid-students", studentId],
    queryFn: async () => {
      const res = await apiGet<PaymentItemData[]>(`/api/payment/items/unpaid/student/${studentId}`);
      return res.data ?? [];
    },
    enabled: !!studentId,
  });
};

export const usePaymentItemsByMajorId = (majorId: string) => {
  return useQuery({
    queryKey: ["payment-by-id-major", majorId],
    queryFn: async () => {
      const res = await apiGet<PaymentItemData[]>(`/api/payment/items/major/${majorId}`);
      return res.data;
    },
    enabled: !!majorId,
  });
};

/** Mark selected payment items as paid and link them to a payment record. */
export const usePaymentItemsSetPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SetPaidInput) => {
      const res = await apiPost("/api/payment/items/setpaid", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
      queryClient.invalidateQueries({ queryKey: ["payment-by-id-major"] });
    },
  });
};

export const BulkUploadPaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemsInput[]) => {
      const res = await apiPost("/api/payment/items/bulk/upload", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
      queryClient.invalidateQueries({ queryKey: ["paymentSubmissions"] });
    },
  });
};

export const usePaymentItemsByStudentId = (id: string) => {
  return useQuery({
    queryKey: ["payment-by-id-student", id],
    queryFn: async () => {
      const res = await apiGet<PaymentItemData[]>(`/api/payment/items/student/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export type PaymentRecapRow = {
  studentId: string;
  name: string;
  nisn: string | null;
  classId: string | null;
  className: string | null;
  itemCount: number;
  paidCount: number;
  unpaidCount: number;
  total: number;
  paid: number;
  unpaid: number;
  paidMonths: Record<string, number>;
};

export const usePaymentRecap = (classId: string, year: string) => {
  return useQuery({
    queryKey: ["payment-recap", classId, year],
    queryFn: async () => {
      const params = new URLSearchParams({ classId });
      if (year) params.set("year", year);
      const res = await apiGet<PaymentRecapRow[]>(`/api/payment/items/recap?${params.toString()}`);
      return res.data;
    },
    enabled: !!classId && !!year,
  });
};

export const usePaymentItemsByFilterDate = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["payment-items-filter-date", startDate, endDate],
    queryFn: async () => {
      const res = await apiGet<PaymentItemData[]>(`/api/payment/items/filter/date?start_date=${startDate}&end_date=${endDate}`);
      return res.data;
    },
  });
};
