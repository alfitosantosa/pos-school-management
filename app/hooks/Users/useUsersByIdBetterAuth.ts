"use client";

// app/api/users/route.ts

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetUserByIdBetterAuth = (id: string) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const response = await apiGet(`/api/userdata/betterauth/id/${id}`);
      return response?.data || null;
    },
    enabled: !!id,
  });
};
