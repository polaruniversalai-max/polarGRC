import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { TenantConfig } from "../../../shared/types/audit";

interface TenantBrandingContextType {
  tenantId: string;
  tenantConfig: TenantConfig | null;
  allTenants: TenantConfig[];
  setTenantId: (id: string) => void;
  isLoading: boolean;
}

const DEFAULT_TENANT_ID = "polar-hq";

const TenantBrandingContext = createContext<TenantBrandingContextType>({
  tenantId: DEFAULT_TENANT_ID,
  tenantConfig: null,
  allTenants: [],
  setTenantId: () => {},
  isLoading: true,
});

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}

export function getTenantId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sentinel-tenant-id") || DEFAULT_TENANT_ID;
  }
  return DEFAULT_TENANT_ID;
}

function applyBrandingCSSVars(config: TenantConfig | null) {
  if (!config) return;
  const root = document.documentElement;
  root.style.setProperty("--tenant-primary", config.primaryColor);
  root.style.setProperty("--tenant-secondary", config.secondaryColor);
  root.style.setProperty("--tenant-name", `"${config.name}"`);
}

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState<string>(getTenantId);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [allTenants, setAllTenants] = useState<TenantConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const setTenantId = useCallback((id: string) => {
    localStorage.setItem("sentinel-tenant-id", id);
    setTenantIdState(id);
  }, []);

  useEffect(() => {
    fetch("/api/v1/tenants/config")
      .then(r => r.json())
      .then(data => {
        if (data.tenants) {
          setAllTenants(data.tenants);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/v1/tenants/${tenantId}/config`)
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(config => {
        if (config && config.id) {
          setTenantConfig(config);
          applyBrandingCSSVars(config);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  return (
    <TenantBrandingContext.Provider value={{ tenantId, tenantConfig, allTenants, setTenantId, isLoading }}>
      {children}
    </TenantBrandingContext.Provider>
  );
}
