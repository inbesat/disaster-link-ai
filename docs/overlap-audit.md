# Layout-Overlap Audit

Systematic sweep for `position: absolute` / `position: fixed` layout-overlap
bugs across the whole app, run after the Phase 27 command-center map toolbar
fix. Scope: real UI overlaps only. Auth (Phase 1) and AI-provider logic
(Phase 2) files are intentionally untouched.

## Fix pattern

Same pattern established by the Phase 27 fix (`components/map/MapActionToolbar.tsx`):
use flex/grid with an explicit gap instead of hand-rolled absolute offsets;
clamp max widths so dropdowns/tooltips never cross the viewport edge; keep one
self-contained stacking context with an explicit z-index. Dropdowns/tooltips
stick to the CSS-tooltip convention (`right-0 top-full z-30`, `role="tooltip"`,
`aria-describedby`) already used by `LiveActivityFeed`.

Note: `@radix-ui/react-*` is limited to `avatar` + `slot` in this repo — no
Tooltip/Popover/DropdownMenu primitives are installed, so the existing CSS
tooltip pattern is the convention to follow.

## Files changed (one line each)

| File | Fix |
| --- | --- |
| `components/EmergencyContactCard.tsx` | Added the `hidden md:flex` gate the comment already promised — the card was rendering on phones and covering the top-right header chrome above the BottomNav. |
| `components/offline/NetworkStatusWidget.tsx` | `hidden md:flex` on the pill: on mobile it sat inside the 72px BottomNav band and covered the nav's right tabs. |
| `components/dashboard/QuickActionsDock.tsx` | Desktop dock raised `bottom-6` → `bottom-14` so its lowest button clears the app-wide NetworkStatusWidget pill (bottom-right corner collision). |
| `components/gov/dashboard/QuickActionDock.tsx` | Same corner collision on `md+`: `md:bottom-6` → `md:bottom-14`. |
| `components/ui/LanguageSelector.tsx` | Added `up` + `align` props so left-edge / bottom-anchored mounts can open their dropdown upward and left-aligned; added `max-w-[calc(100vw-1rem)]` clamp so the 192px list can never clip off-screen on ≤360px phones. |
| `components/public/PublicLanguageFab.tsx` | Passes `up align="left"` — the FAB's dropdown used to open downward (into the BottomNav) and clip off the left edge. |
| `components/dashboard/NotificationCenter.tsx` | Alert dropdown clamped to `max-w-[calc(100vw-1rem)]` — it used to overflow the left edge on narrow phones (no collision flip). |
| `components/admin/AdminSidebar.tsx` | Desktop: `aside` raised to `lg:z-50` so the full-width sticky header (z-40) no longer paints over the sidebar's brand row. Mobile: drawer close button moved `top-3` → `top-14` so it no longer sits on top of the brand row's BackButton. |
| `components/settings/SettingsSidebar.tsx` | Mobile drawer close button `top-3` → `top-14`, same overlap with the brand row's BackButton. |
| `app/(dashboard)/map/page.tsx` | MiniMapWidget moved from `bottom-[200px] right-6` (collided with the vertically-centred MeasurementToolbar at laptop heights) to `top-[124px] right-6`, clear of the header and the toolbar. |
| `components/map/InfoDrawer.tsx` | Desktop drawer moved `left-3 top-[64px]` → `left-[308px] top-[120px]` so it clears both the LayerControl (w-72 at left-3) and the centred MapSearchBar band; body `max-h` adjusted to `calc(100dvh-136px)`. |
| `components/field/FieldRouteMap.tsx` | Recenter FAB raised `bottom-6` → `bottom-24` to clear MapLibre's bottom-right `NavigationControl`. |
| `components/field/SosPanicModal.tsx` | Added `relative` to the modal card so the Cancel button anchors to the card's top-right instead of the full-screen overlay (it floated at the viewport corner, detached from the card). |
| `components/auth/BiometricPrompt.tsx` | Same anchor bug fixed (`relative` on the card) + `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` so the mobile bottom-sheet clears the home indicator. |
| `components/map/MapBottomSheet.tsx` | Sheet content padding now includes `env(safe-area-inset-bottom)` — content no longer sits under the home indicator on mobile. |
| `components/landing/command/LiveMapStats.tsx` | Bottom-left "Live · Demo Data" chip raised `bottom-3` → `bottom-10` so it clears the full-width live-feed ticker below it. |

## Checked and left as-is (intentional / safe)

- **Demo chrome** (`DemoController`, `DemoOrchestrator`, `AlertDemoTrigger`,
  `ActionTriggersPanel`, `DemoMode`, `ScenarioSelector`, `BenchmarkPanel`,
  `FmBroadcastSimulator`, `QADrawer`): dev/pitch-only floating tools by design.
  `DemoOrchestrator`'s `fixed inset-0 z-[800]` overlay is why E2E clicks near
  the mobile bottom edge use `force: true`.
- **Top-of-viewport banners** (`OfflineBanner`, `PwaUpdateBanner`, SOS broadcast
  flash, `SafetyNudge`, `PullToRefresh`): transient, deliberately prominent
  overlays; coordinating per-header offsets would couple unrelated components.
- **`OnboardingTooltip`**: dormant (unused) component.
- **Modal scroll containment**: `ShiftHandover`, `DamageReporterModal`,
  `SitRepGenerator`, `SOSModal`, `AlertDetailModal`, `AlertFeedWidget`,
  `TemplateLibrary`, `VoiceInputButton` already cap height and scroll internally.
- **`SidebarNavItem` tooltip, `MapMarker` hover labels, `LiveCursors`**:
  hover-only decorative labels inside overflow-hidden containers; no functional
  blocking.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean (one pre-existing warning in `FmBroadcastHistory.tsx`,
  unrelated).
- `npx playwright test tests/map-toolbar-overlap.spec.ts --workers=1` — 4/4 pass
  (desktop 1920, laptop 1366, mobile 390×844, tooltip-clip regression).
- `npm test` — 1189/1193 pass; the 4 failures (`lib/config/navigation.test.ts`,
  `lib/sms/twilio-webhook.test.ts`) are pre-existing config/env tests untouched
  by this sweep.

## Recurring root causes found

1. **Comment/class drift** — code comments promised a responsive gate the class
   never had (`EmergencyContactCard`).
2. **Right-anchored dropdowns without max-width clamp** — fine at 390px, clipped
   at 320–360px (`NotificationCenter`, `LanguageSelector`).
3. **Absolute children of un-positioned parents** — "close" buttons anchored to
   the full-screen overlay instead of the card (`SosPanicModal`, `BiometricPrompt`).
4. **Bottom-corner stacking** — app-wide chrome vs per-page docks colliding
   because neither cleared the other's footprint (`NetworkStatusWidget` vs both
   Quick Action docks).
5. **Centred right-edge toolbars vs right-anchored fixed widgets** — vertical
   mid-height stacks collide with any fixed element in the same corner at laptop
   heights (`MeasurementToolbar` vs `MiniMapWidget`).