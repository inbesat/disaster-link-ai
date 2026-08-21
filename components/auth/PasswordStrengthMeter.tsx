"use client";

interface PasswordStrengthMeterProps {
  password?: string;
}

export function calculatePasswordStrength(password: string = ""): {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
} {
  if (!password) return { score: 0, label: "Weak", color: "bg-slate-700" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "bg-severity-red-500" };
  if (score === 3) return { score, label: "Fair", color: "bg-severity-orange-500" };
  if (score === 4) return { score, label: "Good", color: "bg-severity-yellow-500" };
  return { score, label: "Strong", color: "bg-severity-green-500" };
}

export default function PasswordStrengthMeter({ password = "" }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color } = calculatePasswordStrength(password);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Password strength:</span>
        <span className="font-semibold text-slate-200">{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              score >= step ? color : "bg-slate-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
