"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { tahfidzGroupTypes } from "@/app/(types)";

export const useGetTahfidzGroup = () => {
  return useQuery({
    queryKey: ["tahfidzgroup"],
    queryFn: async () => {
      const res = await apiGet("/api/tahfidzgroup");
      return res.data;
    },
  });
};

export const useCreateTahfidzGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: tahfidzGroupTypes) => {
      const res = await apiPost("/api/tahfidzgroup", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tahfidzgroup"] });
    },
  });
};

export const useUpdateTahfidzGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: tahfidzGroupTypes) => {
      const res = await apiPut("/api/tahfidzgroup", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tahfidzgroup"] });
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
  });
};
