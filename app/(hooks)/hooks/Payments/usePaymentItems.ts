"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetPaymentsItems = () => {
  return useQuery({
    queryKey: ["paymentItems"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/payment/items");
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payments");
      }
    },
  });
};

export const useCreatePaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/payment/items", data);
      console.log(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      throw new Error(error?.response?.data?.error || "Failed to update payment items");
    },
  });
};

export const useUpdatePaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/payment/items", data);
      console.log(data);
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
    mutationFn: async (id: any) => {
      const response = await apiDelete(`/api/payment/items`, {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
    },
    onError: (error: any) => {
      console.error("Error deleting payment:", error);
      throw new Error(error?.response?.data?.message || "Failed to delete payment");
    },
  });
};

export const useCreatePaymentItemsBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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
      try {
        const res = await apiGet(`/api/payment/items/${id}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment");
      }
    },
  });
};

export const useGetPaymentByStudentId = (studentId: string) => {
  return useQuery({
    queryKey: ["payment-by-id", "midtransTransaction"],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/payment/student/${studentId}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment");
      }
    },
  });
};

export const usePaymentTransactionSuccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
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

export const usePaymentItemsUnpaidStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["unpaid-students", studentId], // ← tambahkan studentId di sini
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/payment/items/unpaid/student/${studentId}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment");
      }
    },
    enabled: !!studentId, // ← query HANYA jalan jika studentId truthy
  });
};

export const usePaymentItemsByMajorId = (majorId: string) => {
  return useQuery({
    queryKey: ["payment-by-id-major", majorId],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/payment/items/major/${majorId}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment");
      }
    },
  });
};

export const userPaymentItemsSetPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/payment/items/setpaid", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
      queryClient.invalidateQueries({ queryKey: ["payment-by-id-major"] });
    },
  });
};

export const BulkUploadPaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/payment/items/bulk", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-students"] });
    },
  });
};
