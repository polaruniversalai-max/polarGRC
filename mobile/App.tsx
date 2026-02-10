import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-url.com';
const DEFAULT_TENANT_ID = 'polar-hq';

type RouteId = 'ECONOMY' | 'PRO_AUDIT' | 'INSTITUTIONAL';

interface TenantConfig {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  auditorRole: string;
}

interface AuditRecord {
  id: string;
  tenantId: string;
  timestamp: string;
  trace: {
    category: string;
    bifurcationStatus: string;
    summary: string;
    documentHash: string;
    flags: Array<{ clause: string; severity: string; description: string }>;
  };
  antigravity: {
    status: string;
    risk_level: string;
    reasoning: string;
    verified: boolean;
    trace_id: string;
    ethics_check: { found: boolean; format_valid: boolean };
    security_clearance?: {
      tenantId: string;
      authorized: boolean;
      accessScope: string[];
      verifiedAt: string;
    };
  };
  settlement: { txId: string; status: string } | null;
}

const ROUTE_OPTIONS: { id: RouteId; label: string; shortLabel: string; color: string; icon: string }[] = [
  { id: 'ECONOMY', label: 'Economy', shortLabel: 'ECO', color: '#f59e0b', icon: '$' },
  { id: 'PRO_AUDIT', label: 'Pro Audit', shortLabel: 'PRO', color: '#10b981', icon: '\u25C6' },
  { id: 'INSTITUTIONAL', label: 'Instant', shortLabel: 'MAX', color: '#a855f7', icon: '\u26A1' },
];

function getRiskColor(level: string) {
  switch (level) {
    case 'High-Risk':
      return '#ef4444';
    case 'Prior-Intimation':
      return '#f59e0b';
    default:
      return '#10b981';
  }
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: active ? '#10b981' : '#ef4444' },
      ]}
    />
  );
}

function RouteSelector({ selected, onSelect, accentColor }: { selected: RouteId; onSelect: (r: RouteId) => void; accentColor: string }) {
  return (
    <View style={styles.routeSelectorContainer}>
      <Text style={styles.routeSelectorLabel}>COMPLIANCE ROUTE</Text>
      <View style={styles.routeSelector}>
        {ROUTE_OPTIONS.map((route) => {
          const isActive = selected === route.id;
          return (
            <TouchableOpacity
              key={route.id}
              onPress={() => onSelect(route.id)}
              style={[
                styles.routeOption,
                isActive && { backgroundColor: route.color + '25', borderColor: route.color },
                !isActive && { borderColor: '#1e293b' },
              ]}
            >
              <Text style={[styles.routeIcon, { color: isActive ? route.color : '#475569' }]}>{route.icon}</Text>
              <Text style={[styles.routeLabel, { color: isActive ? route.color : '#64748b' }]}>{route.shortLabel}</Text>
              <Text style={[styles.routeSublabel, { color: isActive ? route.color + 'aa' : '#334155' }]}>{route.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.routeIndicator}>
        <View style={[styles.routeIndicatorBar, { backgroundColor: '#1e293b' }]}>
          <View style={[
            styles.routeIndicatorFill,
            {
              backgroundColor: ROUTE_OPTIONS.find(r => r.id === selected)?.color || accentColor,
              width: selected === 'ECONOMY' ? '33%' : selected === 'PRO_AUDIT' ? '66%' : '100%',
            },
          ]} />
        </View>
        <View style={styles.routeIndicatorLabels}>
          <Text style={styles.routeIndicatorText}>Low Gas</Text>
          <Text style={styles.routeIndicatorText}>Max Privacy</Text>
        </View>
      </View>
    </View>
  );
}

function AuditCard({ audit, tenantConfig }: { audit: AuditRecord; tenantConfig: TenantConfig | null }) {
  const riskColor = getRiskColor(audit.antigravity.risk_level);
  const accentColor = tenantConfig?.primaryColor || '#10b981';

  return (
    <View style={[styles.card, { borderColor: accentColor + '30' }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.traceId, { color: accentColor }]}>{audit.antigravity.trace_id}</Text>
        <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.riskText, { color: riskColor }]}>
            {audit.antigravity.risk_level}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusDot active={audit.antigravity.verified} />
        <Text style={styles.statusLabel}>
          {audit.antigravity.verified ? 'VERIFIED' : 'PENDING'}
        </Text>
        <Text style={styles.statusDivider}>|</Text>
        <Text style={styles.statusLabel}>{audit.antigravity.status}</Text>
      </View>

      {audit.antigravity.security_clearance && (
        <View style={styles.clearanceRow}>
          <StatusDot active={audit.antigravity.security_clearance.authorized} />
          <Text style={styles.clearanceLabel}>
            CLEARANCE: {audit.antigravity.security_clearance.authorized ? 'AUTHORIZED' : 'DENIED'}
          </Text>
        </View>
      )}

      <Text style={styles.reasoning} numberOfLines={3}>
        {audit.antigravity.reasoning}
      </Text>

      <View style={styles.ethicsRow}>
        <View style={styles.ethicsItem}>
          <StatusDot active={audit.antigravity.ethics_check.found} />
          <Text style={styles.ethicsLabel}>Ethics</Text>
        </View>
        <View style={styles.ethicsItem}>
          <StatusDot active={audit.antigravity.ethics_check.format_valid} />
          <Text style={styles.ethicsLabel}>Format</Text>
        </View>
        {audit.settlement && (
          <Text style={styles.txLabel}>
            TX: {audit.settlement.txId.slice(0, 10)}...
          </Text>
        )}
      </View>

      <Text style={styles.timestamp}>
        {new Date(audit.timestamp).toLocaleString()}
      </Text>
    </View>
  );
}

export default function App() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteId>('PRO_AUDIT');
  const tenantId = DEFAULT_TENANT_ID;

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/tenants/${tenantId}/config`)
      .then(r => r.ok ? r.json() : null)
      .then(config => {
        if (config && config.id) setTenantConfig(config);
      })
      .catch(() => {});
  }, [tenantId]);

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clinical/audits?limit=5`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (err) {
      console.error('[AuditorCockpit] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAudits();
  }, [fetchAudits]);

  const accentColor = tenantConfig?.primaryColor || '#10b981';
  const orgName = tenantConfig?.name || 'SENTINEL OS';
  const auditorRole = tenantConfig?.auditorRole || 'AUDITOR COCKPIT';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { borderBottomColor: accentColor + '40' }]}>
        <View>
          <Text style={[styles.headerTitle, { color: accentColor }]}>{orgName.toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>{auditorRole.toUpperCase()} v1.2</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
          <Text style={[styles.liveText, { color: accentColor }]}>LIVE</Text>
        </View>
      </View>

      <RouteSelector selected={selectedRoute} onSelect={setSelectedRoute} accentColor={accentColor} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>LOADING AUDIT LOG...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
        >
          {audits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No audits recorded yet.</Text>
              <Text style={styles.emptySubtitle}>
                Run an audit from the web dashboard.
              </Text>
            </View>
          ) : (
            audits.map((audit) => (
              <AuditCard key={audit.id} audit={audit} tenantConfig={tenantConfig} />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#475569',
    fontSize: 10,
    letterSpacing: 4,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  routeSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  routeSelectorLabel: {
    color: '#475569',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: 8,
  },
  routeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  routeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 2,
  },
  routeIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  routeLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 2,
  },
  routeSublabel: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  routeIndicator: {
    marginTop: 10,
  },
  routeIndicatorBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  routeIndicatorFill: {
    height: '100%',
    borderRadius: 2,
  },
  routeIndicatorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  routeIndicatorText: {
    color: '#334155',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#475569',
    marginTop: 16,
    fontSize: 10,
    letterSpacing: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#475569',
    fontSize: 14,
  },
  emptySubtitle: {
    color: '#334155',
    fontSize: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  traceId: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  clearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(6, 78, 59, 0.2)',
    borderRadius: 4,
  },
  clearanceLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  statusDivider: {
    color: '#475569',
    fontSize: 11,
  },
  reasoning: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 12,
  },
  ethicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  ethicsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ethicsLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  txLabel: {
    color: '#475569',
    fontSize: 11,
    fontFamily: 'monospace',
    marginLeft: 'auto',
  },
  timestamp: {
    color: '#334155',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
