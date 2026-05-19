import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export interface Ad {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  providerId?: string | null;
  providerName?: string | null;
  viewCount?: number | null;
  isFeatured: boolean;
  displayOrder: number;
}

type UseAdsResult = {
  ads: Ad[];
  allAds: Ad[];
  isLoading: boolean;
  refresh: () => void;
};

export function useAds(onlyActive = true): UseAdsResult {
  const { data = [], isLoading, refetch } = trpc.featuredAds.list.useQuery();

  const allAds = useMemo(() => {
    return data.map(ad => ({
      ...ad,
      id: ad.id,
      title: ad.title,
      providerId: ad.providerId,
      isFeatured: ad.isFeatured,
      displayOrder: ad.displayOrder,
    }));
  }, [data]);

  const ads = useMemo(() => {
    return allAds.filter(a => a.isFeatured);
  }, [allAds]);

  return { 
    ads: onlyActive ? ads : allAds, 
    allAds, 
    isLoading, 
    refresh: refetch 
  };
}
