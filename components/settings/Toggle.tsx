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
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition active:scale-[0.97] ${
        checked ? "bg-purple-500" : "bg-white/10"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-[22px]" : "translate-x-[4px]"
        }`}
      />
    </button>
  );
}

export default Toggle;
