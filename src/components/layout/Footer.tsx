interface FooterProps {
  demoMode: boolean;
}

export function Footer({ demoMode }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          CarbonWise · Privacy-first carbon footprint awareness. Your data never
          leaves this browser.
        </p>
        <p className="muted" style={{ color: "var(--text-on-dark)" }}>
          {demoMode
            ? "Running in demo mode — Google location data is simulated and clearly labelled."
            : "Live mode — local insights use the Google Maps Platform."}
        </p>
      </div>
    </footer>
  );
}
