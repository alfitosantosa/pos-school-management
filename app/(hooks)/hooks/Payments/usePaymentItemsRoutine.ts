"use client";
import type {
  PaymentItemRoutineBulkPayload,
  PaymentItemRoutineInput,
  PaymentSubmissionData,
} from "@/app/(types)";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetPaymentsItemsRoutine = () => {
  return useQuery({
    queryKey: ["paymentItemsRotine"],
    queryFn: async () => {
      const res = await apiGet("/api/payment/items/routine");
      return res.data;
    },
  });
};

export const useGetPaymentsItemsRoutineByMajorId = (
  majorId: string | undefined,
) => {
  return useQuery({
    queryKey: ["paymentItemsRotine", majorId],
    queryFn: async () => {
      const res = await apiGet(`/api/payment/items/routine/major/${majorId}`);
      return res.data;
    },
    enabled: !!majorId,
  });
};

export const useCreatePaymentItemsRoutines = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemRoutineInput) => {
      const res = await apiPost("/api/payment/items/routine", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItemsRotine"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
    },
  });
};

export const useUpdatePaymentItemsRoutines = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemRoutineInput) => {
      const res = await apiPut("/api/payment/items/routine", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItemsRotine"] });
    },
  });
};

export const useDeletePaymentItemsRoutines = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | string[]) => {
      const response = await apiDelete(`/api/payment/items/routine`, {
        body: JSON.stringify(Array.isArray(id) ? { ids: id } : { id }),
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItemsRotine"] });
    },
  });
};

export const BulkUploadPaymentItemsRoutines = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentItemRoutineBulkPayload[]) => {
      const res = await apiPost("/api/payment/items/routine/bulk/upload", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItemsRotine"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
    },
  });
};

export const useGetPaymentSubmissions = (majorId: string | undefined) => {
  return useQuery({
    queryKey: ["paymentSubmissions", majorId],
    queryFn: async () => {
      const res = await apiGet<PaymentSubmissionData[]>(
        `/api/payment/items/submissions?majorId=${majorId}`,
      );
      return res.data;
    },
    enabled: !!majorId,
  });
};
