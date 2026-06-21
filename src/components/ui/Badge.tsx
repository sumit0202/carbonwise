import { cx } from "@/lib/utils/format";

interface DataSourceBadgeProps {
  demo: boolean;
}

/**
 * Clearly labels whether data is live or synthetic demo data. Uses text, not
 * colour alone, so the distinction is conveyed to all users.
 */
export function DataSourceBadge({ demo }: DataSourceBadgeProps) {
  return (
    <span className={cx("badge", demo ? "badge--demo" : "badge--live")}>
      {demo ? "Demo data" : "Live data"}
    </span>
  );
}
