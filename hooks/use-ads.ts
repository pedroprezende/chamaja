import { useState, useEffect, useCallback } from "react";
import { adsDB, type Ad } from "@/lib/ads-database";

type UseAdsResult = {
  ads: Ad[];
  allAds: Ad[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useAds(onlyActive = true): UseAdsResult {
  const [ads, setAds] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [active, all] = await Promise.all([
        adsDB.getActive(),
        adsDB.getAll(),
      ]);
      setAds(active);
      setAllAds(all);
    } catch {
      setAds([]);
      setAllAds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ads: onlyActive ? ads : allAds, allAds, isLoading, refresh };
}
