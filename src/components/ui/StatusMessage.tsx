import { cx } from "@/lib/utils/format";

interface StatusMessageProps {
  message: string;
  tone?: "info" | "error";
  /** assertive for errors so screen readers announce immediately. */
  live?: "polite" | "assertive";
}

/**
 * Screen-reader-friendly status region. Always rendered (even when empty) so
 * assistive tech registers the live region and announces later updates.
 */
export function StatusMessage({
  message,
  tone = "info",
  live = "polite",
}: StatusMessageProps) {
  return (
    <p
      className={cx("status", tone === "error" && "status--error")}
      role={tone === "error" ? "alert" : "status"}
      aria-live={live}
    >
      {tone === "error" && message ? <span aria-hidden="true">⚠ </span> : null}
      {message}
    </p>
  );
}
