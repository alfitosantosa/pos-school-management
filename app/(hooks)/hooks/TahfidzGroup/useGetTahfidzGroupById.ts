"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetTahfidzGroupById = (id: string) => {
  return useQuery({
    queryKey: ["tahfidzgroup", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/tahfidzgroup/id/${id}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch tahfidz group");
      }
    },
enabled: !!id,
  });
};