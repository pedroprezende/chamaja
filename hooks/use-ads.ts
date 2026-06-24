import { trpc } from "@/lib/trpc";
import { useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [cachedData, setCachedData] = useState<any[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("@chamaja_cached_ads")
      .then((val) => {
        if (val) {
          setCachedData(JSON.parse(val));
        }
      })
      .catch((err) => console.warn("Failed to load cached ads:", err));
  }, []);

  const {
    data = cachedData,
    isLoading,
    refetch,
  } = trpc.featuredAds.list.useQuery(undefined, {
    placeholderData: cachedData.length > 0 ? cachedData : undefined,
  });

  useEffect(() => {
    if (data && data.length > 0 && data !== cachedData) {
      AsyncStorage.setItem("@chamaja_cached_ads", JSON.stringify(data)).catch(
        (err) => console.warn("Failed to save cached ads:", err),
      );
    }
  }, [data, cachedData]);

  const allAds = useMemo(() => {
    return data.map((ad: any) => ({
      ...ad,
      id: ad.id,
      title: ad.title,
      providerId: ad.providerId,
      isFeatured: ad.isFeatured,
      displayOrder: ad.displayOrder,
    }));
  }, [data]);

  const ads = useMemo(() => {
    return allAds.filter((a) => a.isFeatured);
  }, [allAds]);

  return {
    ads: onlyActive ? ads : allAds,
    allAds,
    isLoading: isLoading && cachedData.length === 0,
    refresh: refetch,
  };
}
