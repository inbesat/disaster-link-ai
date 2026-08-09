"use client";

// ---------------------------------------------------------------------
// components/settings/Toggle.tsx — UI/UX Phase 7.
//
// Reusable accessible switch (role="switch") used across the settings
// pages (notifications, map layers, AI tools, districts, …).
// ---------------------------------------------------------------------

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        checked ? "bg-accent" : "bg-tertiary"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span
        aria-hidden
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default Toggle;
