import { useTenantBranding } from "@/contexts/tenant-branding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TenantSelector() {
  const { tenantId, allTenants, setTenantId } = useTenantBranding();

  if (allTenants.length === 0) return null;

  return (
    <Select value={tenantId} onValueChange={setTenantId}>
      <SelectTrigger
        className="h-7 w-auto min-w-[160px] max-w-[260px] text-[10px] font-mono bg-transparent border-[hsl(var(--border))] whitespace-nowrap"
        data-testid="select-tenant"
      >
        <SelectValue placeholder="Select Org" />
      </SelectTrigger>
      <SelectContent className="min-w-[220px]">
        {allTenants.map((t) => (
          <SelectItem key={t.id} value={t.id} data-testid={`tenant-option-${t.id}`}>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: t.primaryColor }}
              />
              <span className="text-[10px] truncate">{t.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
