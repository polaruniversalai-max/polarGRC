/**
 * Sentinel OS v1.2 - Live Audit Map Component
 * ============================================
 * Visual representation of audit failover paths.
 * DeveloperWeek 2026: Miro Bose/Lego Challenge
 * 
 * @component LiveAuditMapView
 * @version 1.2.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  Zap,
  Cloud,
  Database
} from 'lucide-react';
import { createLiveAuditMap, type LiveAuditMap, type AuditNode } from '@/lib/miro';
import { sentinelCore } from '@/lib/sentinel-core';

interface LiveAuditMapViewProps {
  network?: string;
  operation?: string;
  onSimulateFailover?: () => void;
}

function NodeIcon({ type }: { type: AuditNode['type'] }) {
  switch (type) {
    case 'request':
      return <Play className="w-4 h-4" />;
    case 'primary':
      return <Cloud className="w-4 h-4" />;
    case 'secondary':
      return <Database className="w-4 h-4" />;
    case 'tertiary':
      return <Database className="w-4 h-4" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'error':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
}

function getNodeStyles(node: AuditNode): string {
  const baseStyles = 'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-300';
  
  switch (node.status) {
    case 'success':
      return `${baseStyles} border-emerald-500/50 bg-emerald-500/10 text-emerald-400`;
    case 'failed':
      return `${baseStyles} border-red-500/50 bg-red-500/10 text-red-400`;
    case 'active':
      return `${baseStyles} border-amber-500/50 bg-amber-500/10 text-amber-400 animate-pulse`;
    case 'pending':
    default:
      return `${baseStyles} border-slate-600/50 bg-slate-800/30 text-slate-400`;
  }
}

function AuditPath({ auditMap, animated }: { auditMap: LiveAuditMap; animated: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (animated) {
      const interval = setInterval(() => {
        setStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [animated]);

  const nodes = auditMap.nodes;
  const failoverOccurred = nodes.find(n => n.id === 'primary')?.status === 'failed';

  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-2 py-6" data-testid="audit-path-container">
        {nodes.slice(0, 2).map((node, i) => (
          <div key={node.id} className="flex items-center gap-2" data-testid={`node-${node.id}`}>
            <div className={`${getNodeStyles(node)} min-w-[100px]`}>
              <NodeIcon type={node.type} />
              <span className="text-xs font-medium mt-1 text-center" data-testid={`text-node-label-${node.id}`}>{node.label}</span>
            </div>
            {i < 1 && (
              <ArrowRight className={`w-5 h-5 ${step > i ? 'text-emerald-400' : 'text-slate-600'} transition-colors`} />
            )}
          </div>
        ))}

        {failoverOccurred && (
          <>
            <ArrowRight className={`w-5 h-5 ${step > 1 ? 'text-amber-400 animate-pulse' : 'text-slate-600'} transition-colors`} />
            <div className="flex flex-col items-center gap-2">
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                FAILOVER
              </Badge>
              <div className={`${getNodeStyles(nodes[2])} min-w-[100px]`}>
                <NodeIcon type={nodes[2].type} />
                <span className="text-xs font-medium mt-1 text-center">{nodes[2].label}</span>
              </div>
            </div>
          </>
        )}

        <ArrowRight className={`w-5 h-5 ${step > 2 ? 'text-emerald-400' : 'text-slate-600'} transition-colors`} />
        
        <div className={`${getNodeStyles(nodes[4])} min-w-[100px]`}>
          <NodeIcon type={nodes[4].type} />
          <span className="text-xs font-medium mt-1 text-center">{nodes[4].label}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/50">
        <div 
          className="h-full bg-gradient-to-r from-[hsl(var(--electric-cyan))] to-emerald-400 transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function LiveAuditMapView({ 
  network = 'Movement M1', 
  operation = 'Batch Verification',
  onSimulateFailover 
}: LiveAuditMapViewProps) {
  const [auditMap, setAuditMap] = useState<LiveAuditMap | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [failoverMode, setFailoverMode] = useState(false);

  const runAudit = async (simulateFailover: boolean = false) => {
    setIsAnimating(true);
    setFailoverMode(simulateFailover);
    
    // Get real failover status from Sentinel Core
    const status = await sentinelCore.getFailoverStatus();
    const networkHealthy = status.healthStatus[status.currentNetwork] !== false;
    
    const map = createLiveAuditMap(
      network, 
      operation, 
      simulateFailover || !networkHealthy, 
      false
    );
    setAuditMap(map);

    if (simulateFailover) {
      // Trigger actual failover through Sentinel Core
      await sentinelCore.triggerManualFailover('celestia-da');
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 4000);
  };

  useEffect(() => {
    runAudit(false);
  }, [network, operation]);

  return (
    <Card className="bg-[hsl(var(--sovereign-blue))]/50 border-slate-700/50" data-testid="widget-live-audit-map">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
            Live Audit Map
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => runAudit(false)}
              disabled={isAnimating}
              className="h-7 text-xs"
              data-testid="button-run-audit"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isAnimating ? 'animate-spin' : ''}`} />
              Run
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                runAudit(true);
                onSimulateFailover?.();
              }}
              disabled={isAnimating}
              className="h-7 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              data-testid="button-simulate-failover"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Simulate Failover
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {auditMap && (
          <AuditPath auditMap={auditMap} animated={isAnimating} />
        )}
        
        <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Success
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Failover
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Pending
            </span>
          </div>
          {auditMap && (
            <span className="font-mono" data-testid="text-audit-id">
              ID: {auditMap.id}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LiveAuditMapView;
