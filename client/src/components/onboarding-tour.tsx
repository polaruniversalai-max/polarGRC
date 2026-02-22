import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from "react-joyride";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserPreferences {
  auditNotes: string;
  favorites: string[];
  tourCompleted: boolean;
}

const TOUR_STEPS: Step[] = [
  {
    target: "#lra-score",
    title: "LRA Compliance Score",
    content: "Your real-time compliance score based on FDA DSCSA 2026 requirements. Monitor your organization's regulatory standing at a glance.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "#wallet-balance",
    title: "Wallet & Credits",
    content: "Track your $POLAR credit balance, staking rewards, and purchase more credits for compliance operations.",
    placement: "bottom",
  },
  {
    target: "#eight-pillars",
    title: "8-Pillar Architecture",
    content: "The Sovereign Security Architecture with multi-chain verification, privacy shielding, and AI-powered compliance analysis.",
    placement: "top",
  },
  {
    target: "#scan-history",
    title: "Scan History",
    content: "View all pharmaceutical verification scans with blockchain-verified audit trails and compliance status.",
    placement: "top",
  },
  {
    target: '[data-testid="button-open-utility-sidebar"]',
    title: "Utility Sidebar",
    content: "Access your Audit Notes and Favorites from this panel. Notes auto-save to the cloud, and favorited widgets appear here for quick access.",
    placement: "left",
  },
];

interface OnboardingTourProps {
  isUtilitySidebarOpen: boolean;
}

export function OnboardingTour({ isUtilitySidebarOpen }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/v1/user/preferences"],
  });

  const completeTourMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/v1/user/preferences", { tourCompleted: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
    },
  });

  useEffect(() => {
    // Start tour after a short delay if not completed
    if (!isLoading && preferences && !preferences.tourCompleted) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, preferences]);

  const handleCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1);
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as typeof STATUS.FINISHED)) {
      setRun(false);
      completeTourMutation.mutate();
    }
  };

  if (isLoading || preferences?.tourCompleted) {
    return null;
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "hsl(180, 100%, 50%)",
          backgroundColor: "hsl(220, 25%, 12%)",
          textColor: "hsl(0, 0%, 90%)",
          arrowColor: "hsl(220, 25%, 12%)",
          overlayColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "8px",
          padding: "16px",
        },
        tooltipTitle: {
          color: "hsl(180, 100%, 50%)",
          fontSize: "16px",
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: "14px",
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: "hsl(180, 100%, 50%)",
          color: "hsl(220, 25%, 8%)",
          borderRadius: "6px",
          padding: "8px 16px",
          fontWeight: 500,
        },
        buttonBack: {
          color: "hsl(0, 0%, 70%)",
          marginRight: "8px",
        },
        buttonSkip: {
          color: "hsl(0, 0%, 60%)",
        },
        spotlight: {
          borderRadius: "8px",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}

export function useStartTour() {
  const resetTourMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/v1/user/preferences", { tourCompleted: false });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/user/preferences"] });
      window.location.reload();
    },
  });

  return { startTour: () => resetTourMutation.mutate() };
}
