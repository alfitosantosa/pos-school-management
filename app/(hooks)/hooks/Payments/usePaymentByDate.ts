import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const usePaymentsByDate = ({ fromdate, todate, majorId }: { fromdate?: Date; todate?: Date; majorId?: string }) => {
  // Format tanggal ke YYYY-MM-DD menggunakan timezone lokal
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fromdateStr = fromdate ? formatLocalDate(fromdate) : undefined;
  const todateStr = todate ? formatLocalDate(todate) : undefined;

  return useQuery({
    queryKey: ["payments-by-date", fromdateStr, todateStr, majorId],
    queryFn: async () => {
      // Jika tidak ada date range, return empty array
      if (!fromdate || !todate || !fromdateStr || !todateStr) {
        return [];
      }

      // Build params object, only include majorId if it exists
      const params: Record<string, string> = {
        fromdate: fromdateStr,
        todate: todateStr,
      };

      if (majorId) {
        params.majorId = majorId;
      }

      const response = await apiGet("/api/payment/filterdate", { params });
      return response.data;
    },
    // Selalu enabled, tapi return empty array jika tidak ada date
    enabled: true,
  });
};
