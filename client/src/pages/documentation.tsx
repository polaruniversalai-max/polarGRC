import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  BookOpen,
  Shield,
  Briefcase,
  Megaphone,
  Map,
  Rocket,
  Lock,
  DollarSign,
  Puzzle,
  Users,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface DocFile {
  filename: string;
  title: string;
  content: string;
}

const DOC_META: Record<string, { icon: typeof FileText; category: string; description: string }> = {
  "TECH_HANDBOOK.md": { icon: BookOpen, category: "Technical", description: "Architecture, parallel processing, OWASP mitigations, API reference" },
  "SALES_PLAYBOOK.md": { icon: Briefcase, category: "Business", description: "Target markets, value propositions, cost comparisons, objection handling" },
  "MARKETING_ONE_PAGER.md": { icon: Megaphone, category: "Business", description: "Resilience advantage, network coverage, agent fleet overview" },
  "ONBOARDING_GUIDE.md": { icon: Map, category: "Operations", description: "Tenant setup, RPC config, toll road selection, first audit walkthrough" },
  "SECURITY_MANIFESTO.md": { icon: Shield, category: "Security", description: "Zero-Trust architecture, OWASP hardening, vault encryption details" },
  "EXECUTIVE_SUMMARY.md": { icon: DollarSign, category: "Business", description: "Platform overview, market opportunity, revenue model" },
  "FUTURE_ROADMAP.md": { icon: Rocket, category: "Strategy", description: "Upcoming features, multi-chain expansion, enterprise roadmap" },
  "THE_HIDDEN_VALUATION.md": { icon: DollarSign, category: "Business", description: "Valuation framework, competitive advantages, growth metrics" },
  "WHY_MODULAR.md": { icon: Puzzle, category: "Technical", description: "Modular architecture benefits, composability, upgrade paths" },
  "README.md": { icon: FileText, category: "Overview", description: "Project readme and quick-start guide" },
  "Founder_Map.txt": { icon: Users, category: "Team", description: "Founding team structure and roles" },
};

function getCategoryColor(category: string): string {
  switch (category) {
    case "Technical": return "bg-blue-500/20 text-blue-400";
    case "Business": return "bg-emerald-500/20 text-emerald-400";
    case "Security": return "bg-red-500/20 text-red-400";
    case "Operations": return "bg-amber-500/20 text-amber-400";
    case "Strategy": return "bg-purple-500/20 text-purple-400";
    case "Team": return "bg-cyan-500/20 text-cyan-400";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function DocumentationPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ docs: DocFile[] }>({
    queryKey: ["/api/v1/docs"],
  });

  const docs = data?.docs || [];
  const activeDoc = docs.find(d => d.filename === selectedDoc);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" data-testid="docs-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (activeDoc) {
    const meta = DOC_META[activeDoc.filename];
    return (
      <div className="flex flex-col h-full" data-testid="docs-viewer">
        <div className="flex items-center gap-3 p-3 border-b border-[hsl(var(--border))] flex-shrink-0 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDoc(null)}
            data-testid="button-back-to-docs"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            All Docs
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            {meta && <Badge className={getCategoryColor(meta.category)}>{meta.category}</Badge>}
            <span className="text-sm font-medium truncate" data-testid="text-doc-title">{activeDoc.title}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto flex-shrink-0">{activeDoc.filename}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <article className="prose prose-invert prose-sm max-w-none
              prose-headings:text-foreground prose-headings:font-bold prose-headings:border-b prose-headings:border-[hsl(var(--border))] prose-headings:pb-2
              prose-h1:text-xl prose-h1:text-[hsl(var(--electric-cyan))]
              prose-h2:text-lg prose-h2:mt-6
              prose-h3:text-base prose-h3:mt-4
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-code:text-[hsl(var(--electric-cyan))] prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-pre:bg-muted/30 prose-pre:border prose-pre:border-[hsl(var(--border))] prose-pre:rounded-md
              prose-table:text-xs
              prose-th:text-foreground prose-th:bg-muted/30 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-[hsl(var(--border))]
              prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-[hsl(var(--border))] prose-td:text-muted-foreground
              prose-a:text-[hsl(var(--electric-cyan))] prose-a:no-underline hover:prose-a:underline
              prose-hr:border-[hsl(var(--border))]
              prose-blockquote:border-l-[hsl(var(--electric-cyan))] prose-blockquote:text-muted-foreground
            " data-testid="doc-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeDoc.content}
              </ReactMarkdown>
            </article>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="docs-list">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-foreground" data-testid="text-docs-title">Documentation</h1>
          <p className="text-xs text-muted-foreground">
            {docs.length} documents available
          </p>
        </div>
        <Badge className="bg-[hsl(var(--electric-cyan))]/20 text-[hsl(var(--electric-cyan))]">
          Sentinel OS v1.2
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {docs.map((doc) => {
          const meta = DOC_META[doc.filename] || {
            icon: FileText,
            category: "Overview",
            description: doc.title,
          };
          const Icon = meta.icon;
          const wordCount = doc.content.split(/\s+/).length;

          return (
            <Card
              key={doc.filename}
              className="cursor-pointer hover-elevate transition-colors"
              onClick={() => setSelectedDoc(doc.filename)}
              data-testid={`card-doc-${doc.filename.replace(/\.[^.]+$/, "").toLowerCase()}`}
            >
              <CardHeader className="pb-2 flex flex-row items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm truncate">{doc.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={`text-[10px] ${getCategoryColor(meta.category)}`}>
                      {meta.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{wordCount.toLocaleString()} words</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">{meta.description}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-[hsl(var(--electric-cyan))]">
                  <ExternalLink className="w-3 h-3" />
                  Read document
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
