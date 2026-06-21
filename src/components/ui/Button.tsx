import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/utils/format";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "",
  secondary: "btn--secondary",
  danger: "btn--danger",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("btn", VARIANT_CLASS[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
