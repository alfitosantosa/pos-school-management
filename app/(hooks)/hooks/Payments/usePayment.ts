"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { PaymentTypes } from "@/app/(types)/types/payment-types";

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PaymentTypes>) => {
      const res = await apiPost("/api/payment", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-by-id-major"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
      queryClient.invalidateQueries({ queryKey: ["      payment-items-filter-date"] });
      queryClient.invalidateQueries({ queryKey: ["       payments-by-date"] });
    },
  });
};

export const useCreatePaymentBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PaymentTypes>[]) => {
      const res = await apiPost("/api/payment/student/bulk", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PaymentTypes> & { id: string }) => {
      const res = await apiPut("/api/payment", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/api/payment/`, {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error: unknown) => {
      console.error("Error deleting payment:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      throw new Error(errorMessage || "Failed to delete payment", { cause: error });
    },
  });
};

export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: async () => {
      const res = await apiGet(`/api/payment/${id}`);
      return res.data;
    },
  });
};

export const useGetPaymentByIdMajor = (majorId: string) => {
  return useQuery({
    queryKey: ["payment-by-id-major"],
    queryFn: async () => {
      const res = await apiGet(`/api/payment/major/${majorId}`);
      return res.data;
    },
  });
};

export const useGetPaymentByStudentId = (studentId: string) => {
  return useQuery({
    queryKey: ["payment-by-id", "midtransTransaction"],
    queryFn: async () => {
      const res = await apiGet(`/api/payment/student/${studentId}`);
      return res.data;
    },
  });
};

export const usePaymentTransactionSuccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { paymentId: string; transactionId: string; orderId: string }) => {
      const res = await apiPost("/api/payment/success", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-by-id"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
