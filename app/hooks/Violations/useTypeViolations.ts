import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetTypeViolations = () => {
  return useQuery({
    queryKey: ["typeViolations"],
    queryFn: async () => {
      try {
        const response = await apiGet("/api/typeviolations");
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};

export const useCreateTypeViolation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiPost("/api/typeviolations", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typeViolations"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useUpdateTypeViolation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiPut("/api/typeviolations", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typeViolations"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteTypeViolation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete("/api/typeviolations?id=" + id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typeViolations"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
