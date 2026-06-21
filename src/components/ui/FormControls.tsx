import type { ChangeEvent } from "react";

interface BaseFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
}

function describedBy(id: string, hasDesc: boolean, hasError: boolean): string | undefined {
  const ids = [
    hasDesc ? `${id}-desc` : null,
    hasError ? `${id}-err` : null,
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldShell({
  id,
  label,
  description,
  error,
  children,
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {description ? (
        <p className="desc" id={`${id}-desc`}>
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  inputMode?: "text" | "numeric" | "decimal";
  placeholder?: string;
  min?: number;
  max?: number;
}

export function TextField({
  id,
  label,
  description,
  error,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  min,
  max,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} description={description} error={error}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        min={min}
        max={max}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!description, !!error)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}

export function SelectField({
  id,
  label,
  description,
  error,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} description={description} error={error}>
      <select
        id={id}
        name={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!description, !!error)}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
