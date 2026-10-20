"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../cn";

export interface RadioOption {
  value: string;
  label: string;
  hint?: string;
}

export interface RadioGroupProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  label: string;
  name: string;
  className?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  options,
  label,
  name,
  className,
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      aria-label={label}
      name={name}
      className={cn("flex flex-col gap-2", className)}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const labelId = `${id}-label`;
        const hintId = `${id}-hint`;
        return (
          <div key={option.value} className="flex items-start gap-3">
            <RadioGroupPrimitive.Item
              id={id}
              value={option.value}
              // A <label for> does not name a role="radio" button in Chromium,
              // so the name has to be wired explicitly or the radio is silent.
              aria-labelledby={labelId}
              aria-describedby={option.hint ? hintId : undefined}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                "border border-line-strong bg-paper-raised",
                "data-[state=checked]:border-clay",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
              )}
            >
              <RadioGroupPrimitive.Indicator className="block h-2.5 w-2.5 rounded-full bg-clay" />
            </RadioGroupPrimitive.Item>
            <div className="min-w-0">
              <label id={labelId} htmlFor={id} className="block cursor-pointer text-base text-ink">
                {option.label}
              </label>
              {option.hint ? (
                <p id={hintId} className="mt-0.5 text-sm text-ink-muted">
                  {option.hint}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
