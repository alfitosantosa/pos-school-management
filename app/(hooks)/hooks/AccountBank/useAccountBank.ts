"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetAccountBank = () => {
  return useQuery({
    queryKey: ["accountbank"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/accountbank");
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment types");
      }
    },
  });
};

export const useCreateAccountBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/accountbank", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountbank"] });
    },
  });
};

export const useUpdateAccountBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/accountbank", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountbank"] });
      queryClient.invalidateQueries({ queryKey: ["accountbank-by-id-major"] });
    },
  });
};

export const useDeleteAccountBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/api/accountbank/`, {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountbank"] });
    },
    onError: (error: any) => {
      console.error("Error deleting payment type:", error);
      throw new Error(error?.response?.data?.message || "Failed to delete payment type");
    },
  });
};

export const useGetAccountBankByIdMajor = (majorId: string) => {
  return useQuery({
    queryKey: ["accountbank-by-id-major"],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/accountbank/major/${majorId}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch payment");
      }
    },
  });
};
