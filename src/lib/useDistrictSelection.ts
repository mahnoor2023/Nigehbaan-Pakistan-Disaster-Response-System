"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DISTRICT_QUERY_PARAM,
  demoAreaForDistrict,
  districtHasDemoDataset,
  getKarachiDistrict,
  resolveKarachiDistrictId,
  withDistrictQuery,
} from "./districtSelection";
import { actions, useStore } from "./store";

export function useDistrictSelection() {
  const store = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const districtId = resolveKarachiDistrictId(searchParams.get(DISTRICT_QUERY_PARAM), store.districtId);
  const district = getKarachiDistrict(districtId);

  useEffect(() => {
    if (store.districtId !== districtId) actions.setDistrict(districtId);
    const areaId = demoAreaForDistrict(districtId);
    if (areaId && store.area !== areaId) actions.setArea(areaId);
  }, [districtId, store.area, store.districtId]);

  const selectDistrict = useCallback((nextId: string, mode: "push" | "replace" = "replace") => {
    const resolved = resolveKarachiDistrictId(nextId, districtId);
    actions.setDistrict(resolved);
    const areaId = demoAreaForDistrict(resolved);
    if (areaId) actions.setArea(areaId);
    const href = withDistrictQuery(pathname, searchParams.toString(), resolved);
    if (mode === "push") router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  }, [districtId, pathname, router, searchParams]);

  return {
    district,
    districtId,
    hasDemoDataset: districtHasDemoDataset(districtId),
    selectDistrict,
  };
}
