// ---------------------------------------------------------------------
// components/public/WeatherCarousel.tsx — Phase 2 · Step 5 · Weather &
// Flood Forecast mini-card.
//
// Horizontally scrollable 3-day forecast (Today / Tomorrow / Day 3) with
// the scrollbar hidden and cards snapping to the center of the viewport
// (snap-x snap-mandatory + snap-center). Each card is a premium
// iOS-widget-style glass surface — translucent white (bg-white/5),
// heavy background blur, rounded-2xl corners, an inner top-highlight and
// a soft hover lift — showing a weather icon, temperature, rainfall
// prediction and a tiny severity risk badge (reusing the roadmap
// SeverityBadge). Mounted below the Action Card on the citizen dashboard.
// ---------------------------------------------------------------------

import { CloudRain, CloudSun, Sun, type LucideIcon } from "lucide-react";
import SeverityBadge from "@/components/ui/SeverityBadge";
import type { SeverityLevel } from "@/components/ui/SeverityBadge";

type ForecastDay = {
  /** Card label — Today / Tomorrow / Day 3. */
  day: string;
  /** Short date caption under the label. */
  date: string;
  /** Weather icon. */
  icon: LucideIcon;
  /** Daytime high in °C. */
  temp: number;
  /** Rain forecast in mm. */
  rain: number;
  /** Flood-risk badge level (canonical SeverityBadge variants). */
  risk: SeverityLevel;
  /** Badge label override, e.g. "High rain". */
  riskLabel: string;
};

// Mock forecast for the Patna demo district — single edit point.
const FORECAST: ForecastDay[] = [
  {
    day: "Today",
    date: "09 Aug",
    icon: CloudRain,
    temp: 29,
    rain: 120,
    risk: "warning",
    riskLabel: "Heavy rain",
  },
  {
    day: "Tomorrow",
    date: "10 Aug",
    icon: CloudSun,
    temp: 31,
    rain: 45,
    risk: "watch",
    riskLabel: "Light rain",
  },
  {
    day: "Day 3",
    date: "11 Aug",
    icon: Sun,
    temp: 34,
    rain: 0,
    risk: "safe",
    riskLabel: "Dry",
  },
];

export function WeatherCarousel() {
  return (
    <section aria-label="3-day weather and flood forecast">
      {/* Hide scrollbars: Firefox [scrollbar-width:none] + WebKit pseudo */}
      <div
        id="citizen-weather-carousel"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FORECAST.map((day) => {
          const Icon = day.icon;
          return (
            <article
              key={day.day}
              className="w-[78%] shrink-0 snap-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5"
            >
              {/* Day label + risk badge */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{day.day}</p>
                  <p className="text-[0.6875rem] text-[var(--dl-text-muted)]">{day.date}</p>
                </div>
                <SeverityBadge variant={day.risk} label={day.riskLabel} size="sm" />
              </div>

              {/* Weather icon + temperature */}
              <div className="mt-3 flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-300 shadow-[0_4px_20px_rgba(59,130,246,0.3)] ring-1 ring-white/10 backdrop-blur-md"
                >
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <div className="text-right">
                  <p className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-3xl font-bold tabular-nums text-transparent">
                    {day.temp}
                    <span className="text-lg text-[var(--dl-text-muted)]">°C</span>
                  </p>
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--dl-text-muted)]">
                    {day.rain > 0 ? `${day.rain}mm rain` : "No rain"}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Carousel hint */}
      <p className="mt-1 text-center text-[0.6875rem] text-[var(--dl-text-muted)]">
        Swipe for the 3-day outlook
      </p>
    </section>
  );
}

export default WeatherCarousel;