"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetPaymentTypes = () => {
  return useQuery({
    queryKey: ["paymentTypes"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/paymenttype");
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment types");
      }
    },
  });
};

export const useCreatePaymentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/paymenttype", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTypes"] });
    },
  });
};

export const useUpdatePaymentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/paymenttype", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTypes"] });
    },
  });
};

export const useDeletePaymentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiDelete("/api/paymenttype", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTypes"] });
    },
  });
};

export const useGetPaymentTypeById = (id: string) => {
  return useQuery({
    queryKey: ["paymentType", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/paymenttype/${id}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment type");
      }
    },
  });
};