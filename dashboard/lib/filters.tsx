"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Filters {
  titles: string[];
  regions: string[];
  contract_type: string[];
  remote_policy: string[];
  experience_level: string[];
  source: string;
}

const defaultFilters: Filters = {
  titles: [],
  regions: [],
  contract_type: [],
  remote_policy: [],
  experience_level: [],
  source: "",
};

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string[] | string) => void;
  resetFilters: () => void;
  toQueryString: (overrides?: Partial<Filters>) => string;
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const setFilter = useCallback((key: keyof Filters, value: string[] | string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const toQueryString = useCallback(
    (overrides?: Partial<Filters>) => {
      const merged = { ...filters, ...overrides };
      const params = new URLSearchParams();
      if (merged.titles.length) params.set("titles", merged.titles.join(","));
      if (merged.regions.length) params.set("regions", merged.regions.join(","));
      if (merged.contract_type.length) params.set("contract_type", merged.contract_type.join(","));
      if (merged.remote_policy.length) params.set("remote_policy", merged.remote_policy.join(","));
      if (merged.experience_level.length) params.set("experience_level", merged.experience_level.join(","));
      if (merged.source) params.set("source", merged.source);
      return params.toString();
    },
    [filters]
  );

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, toQueryString }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
