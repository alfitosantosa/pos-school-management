import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { CACHE_STRATEGIES } from "@/app/client/providers";

export const useGetMajors = () => {
  return useQuery({
    queryKey: ["majors"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/major");
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    // ✅ Majors are static - cache for 1 hour (rarely change during a session)
    ...CACHE_STRATEGIES.static,
  });
};

export const useCreateMajor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPost("/api/major", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useUpdateMajor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiPut("/api/major", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteMajor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete(`/api/major`, {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useGetMajorById = (id: string) => {
  return useQuery({
    queryKey: ["major", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/major/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};
