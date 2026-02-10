/**
 * Sentinel OS v1.2 - AI Insight Modal
 * ====================================
 * Glassmorphism UI with typewriter animation for Opik traces.
 * DeveloperWeek 2026: Perfect Corp $1,500 Challenge
 * 
 * @component AIInsightModal
 * @version 1.2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Zap, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface OpikTrace {
  id: string;
  operation: string;
  reasoning: string;
  confidence: number;
  duration_ms: number;
  status: 'success' | 'warning' | 'error';
  recommendations: string[];
  timestamp: number;
}

interface AIInsightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traces?: OpikTrace[];
  title?: string;
}

function TypewriterText({ text, speed = 20, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="font-mono">
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-[hsl(var(--electric-cyan))]">|</span>
      )}
    </span>
  );
}

const MOCK_TRACES: OpikTrace[] = [
  {
    id: 'trace-001',
    operation: 'DSCSA Batch Verification',
    reasoning: 'Analyzing GS1 product identifiers against FDA DSCSA 2026 requirements. Verifying ATP status for all trading partners in the supply chain. Cross-referencing batch numbers with Movement M1 on-chain records for immutable audit trail.',
    confidence: 0.97,
    duration_ms: 142,
    status: 'success',
    recommendations: [
      'Batch verification completed under 200ms threshold',
      'All ATP partners verified with valid credentials',
      'Movement M1 anchor confirmed'
    ],
    timestamp: Date.now() - 5000
  },
  {
    id: 'trace-002',
    operation: 'Zero-Trust Access Control',
    reasoning: 'Evaluating RBAC permissions for physician role accessing patient record. Checking multi-factor authentication status and session validity. Applying least-privilege principle with audit logging enabled.',
    confidence: 0.99,
    duration_ms: 45,
    status: 'success',
    recommendations: [
      'MFA verified successfully',
      'Access granted with full audit trail',
      'Session timeout set to 30 minutes'
    ],
    timestamp: Date.now() - 3000
  },
  {
    id: 'trace-003',
    operation: 'Network Failover Detection',
    reasoning: 'Primary Movement M1 RPC latency exceeded 150ms threshold. Initiating automatic failover to Celestia DA fallback. Monitoring secondary endpoint health and preparing tertiary local cache.',
    confidence: 0.92,
    duration_ms: 187,
    status: 'warning',
    recommendations: [
      'Failover completed in 187ms (within 200ms SLA)',
      'Consider investigating M1 RPC performance',
      'Celestia DA now serving as active provider'
    ],
    timestamp: Date.now() - 1000
  }
];

export function AIInsightModal({ open, onOpenChange, traces = MOCK_TRACES, title = 'AI Reasoning Traces' }: AIInsightModalProps) {
  const [activeTraceIndex, setActiveTraceIndex] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTraceIndex(0);
      setTypingComplete(false);
    }
  }, [open]);

  const currentTrace = traces[activeTraceIndex];

  const StatusIcon = currentTrace?.status === 'success' ? CheckCircle2 :
                     currentTrace?.status === 'warning' ? AlertTriangle : XCircle;
  
  const statusColor = currentTrace?.status === 'success' ? 'text-emerald-400' :
                      currentTrace?.status === 'warning' ? 'text-amber-400' : 'text-red-400';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl backdrop-blur-xl bg-[hsl(var(--sovereign-blue))]/80 border border-[hsl(var(--electric-cyan))]/30 shadow-[0_8px_32px_rgba(0,212,255,0.15)]"
        data-testid="modal-ai-insight"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[hsl(var(--electric-cyan))]/20 to-purple-500/20 backdrop-blur">
              <Sparkles className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
            </div>
            <span className="bg-gradient-to-r from-[hsl(var(--electric-cyan))] to-purple-400 bg-clip-text text-transparent">
              {title}
            </span>
            <Badge variant="outline" className="ml-auto border-[hsl(var(--electric-cyan))]/50 text-[hsl(var(--electric-cyan))]">
              Opik
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="space-y-4 mt-4" data-testid="ai-insight-content">
          <div className="flex gap-2 overflow-x-auto pb-2" data-testid="trace-selector">
            {traces.map((trace, index) => (
              <Button
                key={trace.id}
                variant={index === activeTraceIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveTraceIndex(index);
                  setTypingComplete(false);
                }}
                className={index === activeTraceIndex ? 
                  'bg-[hsl(var(--electric-cyan))]/20 border-[hsl(var(--electric-cyan))]/50' : 
                  'opacity-60 hover:opacity-100'
                }
                data-testid={`button-trace-${index}`}
              >
                <Brain className="w-3 h-3 mr-1" />
                {trace.operation.split(' ')[0]}
              </Button>
            ))}
          </div>

          {currentTrace && (
            <div className="rounded-xl p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {currentTrace.operation}
                </h3>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                  <span className="text-xs text-muted-foreground">
                    {currentTrace.duration_ms}ms
                  </span>
                </div>
              </div>

              <div className="min-h-[100px] text-sm text-slate-300 leading-relaxed mb-4" data-testid="trace-reasoning">
                <TypewriterText 
                  text={currentTrace.reasoning} 
                  speed={15}
                  onComplete={() => setTypingComplete(true)}
                />
              </div>

              {typingComplete && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="trace-confidence">
                    <span>Confidence:</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[hsl(var(--electric-cyan))] to-emerald-400 transition-all duration-1000"
                        style={{ width: `${currentTrace.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-emerald-400 font-mono" data-testid="text-confidence-value">{(currentTrace.confidence * 100).toFixed(0)}%</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <h4 className="text-xs font-medium text-slate-400 mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {currentTrace.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
            <span>Powered by Opik Observability</span>
            <a 
              href="https://www.comet.com/opik/polar-universal/home" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[hsl(var(--electric-cyan))] hover:underline"
            >
              View Full Traces →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AIInsightModal;
