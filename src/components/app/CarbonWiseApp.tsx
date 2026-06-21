"use client";

import { useMemo, useState } from "react";
import { EcoGuidePanel } from "@/components/assistant/EcoGuidePanel";
import { CalculatorView } from "@/components/calculator/CalculatorView";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { Footer } from "@/components/layout/Footer";
import { Header, type TabItem } from "@/components/layout/Header";
import { Landing } from "@/components/layout/Landing";
import { LocationInsights } from "@/components/maps/LocationInsights";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateFootprint } from "@/lib/emissions/calculator";
import { generateRecommendations } from "@/lib/recommendations/ecoGuide";
import { useCarbonState } from "@/hooks/useCarbonState";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";
import {
  toEnvironmentContext,
  useLocationInsights,
} from "@/hooks/useLocationInsights";
import { DEFAULT_PROFILE } from "@/lib/options";

const TABS: readonly TabItem[] = [
  { id: "home", label: "Home" },
  { id: "profile", label: "Profile" },
  { id: "calculator", label: "Calculator" },
  { id: "assistant", label: "EcoGuide" },
  { id: "dashboard", label: "Dashboard" },
  { id: "insights", label: "Local Insights" },
];

export function CarbonWiseApp() {
  const carbon = useCarbonState();
  const { config } = useRuntimeConfig();
  const [tab, setTab] = useState<string>("home");

  const profile = carbon.state.profile;
  const activities = carbon.state.activities;

  const footprint = useMemo(
    () => (profile ? calculateFootprint(profile, activities) : null),
    [profile, activities],
  );

  const insightsEnabled = tab === "insights" || tab === "assistant";
  const insights = useLocationInsights({
    enabled: insightsEnabled,
    city: profile?.city,
    coordinates: profile?.coordinates,
  });
  const environment = toEnvironmentContext(insights.data);

  const recommendations = useMemo(
    () =>
      profile && footprint
        ? generateRecommendations({ profile, footprint, environment })
        : [],
    [profile, footprint, environment],
  );

  function handleSaveProfile(next: typeof DEFAULT_PROFILE) {
    carbon.setProfile(next);
    setTab("calculator");
  }

  const needsProfile = !profile;

  return (
    <>
      <Header tabs={TABS} activeTab={tab} onSelect={setTab} />
      <main id="main-content" className="container" tabIndex={-1}>
        {tab === "home" ? (
          <Landing onStart={() => setTab("profile")} demoMode={config.demoMode} />
        ) : null}

        {tab === "profile" ? (
          <ProfileForm
            initialProfile={profile ?? DEFAULT_PROFILE}
            onSave={handleSaveProfile}
          />
        ) : null}

        {tab !== "home" && tab !== "profile" && needsProfile ? (
          <Card>
            <h2>Start with your profile</h2>
            <p>
              Tell us a little about your lifestyle and we&apos;ll estimate your
              footprint and tailor recommendations.
            </p>
            <Button onClick={() => setTab("profile")}>Go to profile</Button>
          </Card>
        ) : null}

        {tab === "calculator" && profile && footprint ? (
          <CalculatorView
            footprint={footprint}
            activities={activities}
            onAddActivity={carbon.addActivity}
            onRemoveActivity={carbon.removeActivity}
          />
        ) : null}

        {tab === "assistant" && profile ? (
          <EcoGuidePanel
            recommendations={recommendations}
            actions={carbon.state.actions}
            environment={environment}
            onSetStatus={carbon.setActionStatus}
          />
        ) : null}

        {tab === "dashboard" && profile && footprint ? (
          <DashboardView
            footprint={footprint}
            history={carbon.state.history}
            actions={carbon.state.actions}
            recommendations={recommendations}
            onExport={carbon.exportData}
            onClearAll={carbon.clearAll}
          />
        ) : null}

        {tab === "insights" && profile ? (
          <LocationInsights
            status={insights.status}
            data={insights.data}
            category={insights.category}
            setCategory={insights.setCategory}
            apiKey={config.mapsApiKey}
          />
        ) : null}
      </main>
      <Footer demoMode={config.demoMode} />
    </>
  );
}
