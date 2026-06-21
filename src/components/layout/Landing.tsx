import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface LandingProps {
  onStart: () => void;
  demoMode: boolean;
}

export function Landing({ onStart, demoMode }: LandingProps) {
  return (
    <section aria-labelledby="hero-heading">
      <div className="hero">
        <h1 id="hero-heading">Understand and shrink your carbon footprint</h1>
        <p>
          CarbonWise helps individuals understand, track, and reduce their
          carbon footprint through simple actions and personalized insights —
          the heart of this challenge. Answer a few questions, see where your
          emissions come from, and get tailored, achievable steps.
        </p>
        <p>
          <Button onClick={onStart}>Calculate my footprint</Button>
        </p>
      </div>

      <div className="value-grid">
        <Card>
          <h2>Privacy-first by design</h2>
          <p>
            There is no account and no database. Everything you enter stays in
            your browser&apos;s local storage. You can export or delete your data
            at any time, and we round any coordinates before saving them.
          </p>
        </Card>
        <Card>
          <h2>Personalized, not generic</h2>
          <p>
            EcoGuide, our rule-based assistant, weighs your diet, commute,
            household and local environment to recommend the actions that cut the
            most CO₂e for you.
          </p>
        </Card>
        <Card>
          <h2>Works with or without keys</h2>
          <p>
            {demoMode
              ? "You're in demo mode: local insights use clearly labelled sample data, so the full experience works offline."
              : "Live mode is active: local insights use the Google Maps Platform for your area."}
          </p>
        </Card>
      </div>
    </section>
  );
}
