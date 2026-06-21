interface MeterProps {
  label: string;
  value: number;
  max: number;
  /** Visible value text, e.g. "12.5 kg". Defaults to value/max. */
  valueText?: string;
}

/** Accessible progress meter; value is exposed via ARIA, not colour alone. */
export function Meter({ label, value, max, valueText }: MeterProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));
  const text = valueText ?? `${value} of ${max}`;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={text}
      className="meter"
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
