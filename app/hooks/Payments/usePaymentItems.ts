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
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
    },
  });
};

export const useUpdatePaymentItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/paymen/items", data);
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
    mutationFn: async (ids: any) => {
      const response = await apiDelete(`/api/payment/items`, {
        body: JSON.stringify({ ids }),
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

// export const useCreatePaymentBulk = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: any) => {
//       const res = await apiPost("/api/payment/student/bulk", data);
//       return res.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["paymentItems"] });
//     },
//   });
// };

export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/payment/${id}`);
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
