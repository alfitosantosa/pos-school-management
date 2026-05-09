"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetBillingItems = () => {
  return useQuery({
    queryKey: ["billingItems"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/billingitems");
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch billing items");
      }
    },
  });
};

export const useCreateBillingItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/billingitems", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingItems"] });
    },
  });
};

export const useUpdateBillingItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/billingitems", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingItems"] });
    },
  });
};

export const useDeleteBillingItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: any) => {
      const response = await apiDelete(`/api/billingitems`, {
        body: JSON.stringify({ ids }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingItems"] });
    },
    onError: (error: any) => {
      console.error("Error deleting billing item:", error);
      throw new Error(error?.response?.data?.message || "Failed to delete billing item");
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

// export const useGetBillingItemById = (id: string) => {
//   return useQuery({
//     queryKey: ["billingItem", id],
//     queryFn: async () => {
//       try {
//         const res = await apiGet(`/api/billing/items/${id}`);
//         return res.data;
//       } catch (error: any) {
//         throw new Error(error?.response?.data?.message || "Failed to fetch billing item");
//       }
//     },
//   });
// };

// export const useGetPaymentByStudentId = (studentId: string) => {
//   return useQuery({
//     queryKey: ["payment-by-id", "midtransTransaction"],
//     queryFn: async () => {
//       try {
//         const res = await apiGet(`/api/payment/student/${studentId}`);
//         return res.data;
//       } catch (error: any) {
//         throw new Error(error?.response?.data?.message || "Failed to fetch Billing Items");
//       }
//     },
//   });
// };

// export const usePaymentTransactionSuccess = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: any) => {
//       const res = await apiPost("/api/payment/success", data);
//       return res.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["payment-by-id"] });
//     },
//     onError: (error) => {
//       console.error(error);
//     },
//   });
// };
