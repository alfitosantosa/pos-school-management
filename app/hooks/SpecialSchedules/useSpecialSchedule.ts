"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetSpecialSchedules = () => {
  return useQuery({
    queryKey: ["specialSchedules"],
    queryFn: async () => {
      const response = await apiGet("/api/specialschedule");
      return response.data;
    },
  });
};

export const useCreateSpecialSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiPost("/api/specialschedule", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialSchedules"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useUpdateSpecialSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiPut("/api/specialschedule", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialSchedules"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteSpecialSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiDelete("/api/specialschedule", {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialSchedules"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
