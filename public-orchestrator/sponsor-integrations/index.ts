/**
 * PUBLIC ORCHESTRATOR
 * Sponsor Integrations Index
 * 
 * DeveloperWeek 2026 Sponsor Challenge Integrations
 * All sponsor code is in public folders for judge verification.
 */

export const SPONSOR_MANIFEST = {
  sanity: {
    name: 'Sanity.io',
    challenge: '$500 Headless CMS Challenge',
    implementation: 'Compliance rules stored in Content Lake with mock fallback',
    files: ['client/src/lib/sanity.ts'],
  },
  miro: {
    name: 'Miro',
    challenge: 'Bose/Lego Innovation Challenge',
    implementation: 'Live Audit Map with network failover visualization',
    files: ['client/src/lib/miro.ts', 'client/src/components/live-audit-map.tsx'],
  },
  perfectCorp: {
    name: 'Perfect Corp',
    challenge: '$1,500 AI Innovation Challenge',
    implementation: 'AI Insight Modal with Opik reasoning traces and typewriter animation',
    files: ['client/src/components/ai-insight-modal.tsx'],
  },
  replitMobile: {
    name: 'Replit Mobile',
    challenge: '$1,000 + iPad Mobile Challenge',
    implementation: 'Pull-to-refresh, haptic feedback, responsive design',
    files: [
      'client/src/components/pull-to-refresh.tsx',
      'client/src/hooks/use-mobile.tsx',
    ],
  },
  indiaAI: {
    name: 'IndiaAI Mission',
    challenge: '₹1 Crore Innovation Challenge',
    implementation: 'Technical Pack export for submission',
    files: ['client/src/components/india-ai-pack-export.tsx'],
  },
};

export const getSponsorFiles = (sponsorId: keyof typeof SPONSOR_MANIFEST): string[] => {
  return SPONSOR_MANIFEST[sponsorId]?.files || [];
};

export const getAllSponsorFiles = (): string[] => {
  return Object.values(SPONSOR_MANIFEST).flatMap(s => s.files);
};
