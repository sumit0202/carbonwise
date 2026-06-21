import type { ReactNode } from "react";
import { cx } from "@/lib/utils/format";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}

export function Card({ children, className, as: Tag = "div" }: CardProps) {
  return <Tag className={cx("card", className)}>{children}</Tag>;
}
