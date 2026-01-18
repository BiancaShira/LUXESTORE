import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSalesAnalytics() {
  return useQuery({
    queryKey: [api.analytics.sales.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.sales.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.analytics.sales.responses[200].parse(await res.json());
    },
  });
}
