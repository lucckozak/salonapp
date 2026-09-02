"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[13px] font-medium text-muted-strong",
        className,
      )}
      {...props}
    />
  );
}

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  htmlFor,
}: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(controlBase, "h-11", className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlBase, "min-h-[92px] py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        controlBase,
        "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%238a8177%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function LabeledInput({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      htmlFor={id}
    >
      <Input id={id} required={required} {...props} />
    </Field>
  );
}
