"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetTahfidzGroup = () => {
  return useQuery({
    queryKey: ["tahfidzgroup"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/tahfidzgroup");
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch classes");
      }
    },
  });
};

export const useCreateTahfidzGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/tahfidzgroup", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tahfidzgroup"] });
    },
    onError: (error: any) => {
      console.error("Error creating class:", error);
      throw new Error(error?.response?.data?.message || "Failed to create class");
    },
  });
};

export const useUpdateTahfidzGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/tahfidzgroup", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tahfidzgroup"] });
    },
    onError: (error: any) => {
      console.error("Error updating tahfidz group:", error);
      throw new Error(error?.response?.data?.message || "Failed to update tahfidz group");
    },
  });
};

export const useDeleteTahfidzGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/api/tahfidzgroup/`, {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tahfidzgroup"] });
    },
    onError: (error: any) => {
      console.error("Error deleting tahfidz group:", error);
      throw new Error(error?.response?.data?.message || "Failed to delete tahfidz group");
    },
  });
};
