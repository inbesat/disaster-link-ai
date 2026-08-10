# 🚨 Test the Disaster Response Platform — Friend-Friendly Guide

This guide turns the technical QA checklist into plain-language steps.
You don't need to know any code to run these. Just follow the steps and tick ✅
or ❌ next to each test.

---

## ✅ Before you start (do this once)

1. **Start the app**
   - Open a terminal in the project folder and run:
     ```
     npm run dev
     ```
   - Open a browser and go to: **http://localhost:3000**
   - Keep the terminal open — some demos print messages there (that's expected).

2. **Reset the demo data** (do this whenever a section says "after demo reset")
   - In the same terminal, run:
     ```
     npm run demo:reset
     ```
   - If the terminal is busy, open a second terminal in the same folder.

3. **The 4 ways to "log in"** (you'll switch between these all day):
   - **Guest responder** → go to `/login`, click **"Continue as Guest (Demo)"**
   - **Government official** → go to `/gov/login`, type ANY email + any 6+ character
     password, click **Sign In** (demo accepts anything)
   - **Public citizen** → go to `/public/login`, enter any phone number, use ANY
     6-digit OTP (e.g. `123456`)
   - **Field responder OTP** → on `/login`, use the "passwordless OTP" box: any
     valid-looking phone number, then check the *terminal window* for the code.

4. **Simulating a phone** (for all "Mobile" tests)
   - No phone needed. In Chrome, press **F12** → click the **phone icon**
     (top-left of the dev tools) → pick a phone size like iPhone 14.
   - Tablet tests → pick width around 768–1024 px.

5. **How to score**: after each step, look for the "You'll know it passes when…"
   line. If you see it → ✅. If something looks broken (error screen, blank page,
   button does nothing) → ❌ and write one sentence about what happened.

---

# Section A — Admin Control Panel & Analytics
*What this is:* the dashboard that bosses/admins use to manage users, see
reports and stats, and control the system.

**Tester's tool:** a Laptop / desktop browser.
**Log in as:** Government official (any credentials) — that gives you admin powers.

1. **A1 — Admin home page.** Go to `/admin-dashboard`.
   *Passes when:* you see statistic cards (numbers like "people at risk", "shelters",
   "resources"). A menu/loading error is NOT a pass.

2. **A2 — A district admin opens the same page.**
   *Passes when:* the page loads normally (no error), showing the same style of widgets.

3. **A3 — A field worker is blocked from admin pages.** Log in as Guest
   responder, then type `/users` in the address bar.
   *Passes when:* you get a "403 / Access denied" style page. You should NOT
   see the user list.

4. **A4 — A guest is blocked from bulk operations.** Still as a guest, open
   `/bulk-ops`.
   *Passes when:* you're bounced to the 403 "no permission" page.

5. **A5 — Admin changes a person's role.** Log in as government official, open
   `/users`, find a user, and change their role (e.g. responder → admin).
   *Passes when:* the role changes on the list, and nothing crashes.

6. **A6 — Admin deactivates a user.** Find a user and switch them to "inactive".
   *Passes when:* they are marked inactive / greyed out in the list.

7. **A7 — Admin reactivates a user.**
   *Passes when:* the user is back to "active" and visible normally.

8. **A8 — Edit flood danger thresholds.** Go to `/districts`, pick a district,
   move the flood-threshold sliders and save.
   *Passes when:* the values save (no error) and show again after reload.

9. **A9 — Run a bulk action.** Go to `/bulk-ops`, pick an action such as a "mass
   alert" and run it.
   *Passes when:* it completes without a 500/error screen.

10. **A10 — Analytics page.** Open `/analytics`.
    *Passes when:* charts and graphs render (not an empty page).

11. **A11 — Audit log.** Open `/audit-logs`.
    *Passes when:* you see a table with "who did what, when" rows
    (person / action / time).

12. **A12 — System health.** Open `/health`.
    *Passes when:* status cards for API / database / AI / data-ingestion appear.

13. **A13 — Export data.** Find an "Export" / "Download" button and click it.
    *Passes when:* a CSV or JSON download starts.

14. **A14 — Simulation mode.** Find the simulation toggle (look for "Simulation").
    *Passes when:* the switch flips on without breaking other pages.

15. **A15 — Admin panel on a tablet screen.**
    *Passes when:* the side menu is usable and nothing spills off the right edge.

---

# Section B — The "Agent Squad" (AI that works together)
*What this is:* 5 AI helpers (Predict, Plan, Allocate, Communicate, Check) work
together like a team to plan a response.

**Tester's tool:** Laptop; last test on Mobile.
**Log in as:** Government official.

1. **B1 — Open `/agent-orchestration`.**
   *Passes when:* 5 agent cards appear: Predictor, Planner, Allocator,
   Communicator, Validator.

2. **B2 — Run the whole flow.** Press the "Trigger / Run orchestration" button.
   *Passes when:* you see the agents work one after another — Predict first,
   then Plan, then Allocate — and each card's status flips from "Thinking" to
   "Complete".

3. **B3 — Dangerous prediction auto-plans.** If the predictor finds a "critical"
   danger.
   *Passes when:* the planner agent starts automatically, no button press.

4. **B4 — Plan waits for a human.** During the flow, the graph should pause at
   an "Approval Checkpoint".
   *Passes when:* the pipeline visibly halts and waits for your approval.

5. **B5 — Approve the plan.** Click approve.
   *Passes when:* the comms and allocation agents run, and the plan's status changes.

6. **B6 — Reject the plan.** Run again and click reject / "request changes".
   *Passes when:* the plan is flagged and NO alerts are sent out.

7. **B7 — Decision log.** Look at the "Decision log" panel.
   *Passes when:* it shows a chain of reasoning entries, each with a time.

8. **B8 — Replay timeline.** Use the replay/scrub control.
   *Passes when:* you can step through the simulated response step-by-step.

9. **B9 — Adjust agent settings.** Open the agent config panel, change a
   threshold like "risk sensitivity".
   *Passes when:* the new value sticks (comes back after refresh).

10. **B10 — Shelter conflict.** Force a conflict, e.g. full shelter chosen.
    *Passes when:* the Validator flags it and raises a notice for a human admin.

11. **B11 — On a phone.**
    *Passes when:* the agent cards stack neatly and statuses are still readable.

---

# Section C — AI Emergency Planner ("Command AI")
*What this is:* a chat with an AI that drafts real evacuation plans for districts.

**Tester's tool:** Laptop (last two on Mobile).
**Log in as:** Guest responder is enough for most of these.

1. **C1 — Open `/ai-planner`.**
   *Passes when:* header says "Bharat Shakti Emergency AI" / "Tactical 48-hour
   evacuation planner" and the status says ONLINE.

2. **C2 — Fresh chat.** If the chat is empty:
   *Passes when:* you see "Ready for tactical planning." plus 3 suggested
   question chips.

3. **C3 — Ask for a plan.** Click the chip "Draft a 48-hour evacuation plan
   for Kankarbagh" (or type it yourself).
   *Passes when:* status says "thinking", tool badges appear and tick off, then
   a full plan text streams in.

4. **C4 — Shelter tool badge.** Watch the badges during the plan.
   *Passes when:* you see "🏥 Querying Shelter Database [district] … → ✓".

5. **C5 — Flood tool badge.**
   *Passes when:* you see "🛰️ Accessing Satellite Flood Data [district] … → ✓".

6. **C6 — Sources panel.** Click the "Sources" accordion.
   *Passes when:* it expands and shows each tool with its input and output.

7. **C7 — Thumbs up.** Click the 👍 on a message.
   *Passes when:* a thank-you / confirmation toast appears.

8. **C8 — Thumbs down.** Click the 👎.
   *Passes when:* feedback is recorded (a toast / note appears).

9. **C9 — Refresh keeps chat.** With a conversation open, hit F5/reload.
   *Passes when:* the conversation comes back (it's saved in the browser).

10. **C10 — Clear session.** Click "Clear Session".
    *Passes when:* messages vanish and a toast says "Session cleared."

11. **C11 — Token counter.** A small counter like 5/5.
    *Passes when:* it drops with each send; at ≤2 turns it turns amber; at 0 red.

12. **C12 — Run out of questions.** Send 5 messages so the counter hits 0.
    *Passes when:* a rate-limit message appears and the input is disabled until
    it refills (~60s).

13. **C13 — Keyboard shortcuts.** Click in the box. Press **Enter** to send.
    *Passes when:* message sends. Press **Shift+Enter** — *Passes when:* a new
    line appears instead of sending.

14. **C14 — Ask about a district it can't see.** Ask for a plan for some other
    district.
    *Passes when:* the AI politely refuses / uses only allowed districts —
    no "leaked" data in its answer.

15. **C15 — Wrong role asks for a plan.** Log in as a non-commander role.
    *Passes when:* the planning tools are missing / plan unavailable.

16. **C16 — AI is fully down.** (Skip if you can't simulate — the point is
    resilience.)
    *Passes when:* instead of crashing, you get a friendly message explaining
    the provider is unavailable.

17. **C17 — Too many requests from one computer.** Send 6 rapid messages.
    *Passes when:* the 6th gets a "Too many requests — try again in Xs" message.

18. **C18 — "View Context" drawer on mobile.** Tap the "View Context" button.
    *Passes when:* an Operation Context panel slides open; and the Close button
    closes it.

19. **C19 — Chat on mobile.** Send a prompt from phone view.
    *Passes when:* the answer streams in and the view scrolls to the newest
    message automatically.

---

# Section D — Public AI Assistant "Mitron"
*What this is:* a friendly AI helper for ordinary citizens in the app's bottom sheet.

**Tester's tool:** Mobile.
**Log in as:** Public citizen (or without login).

1. **D1 — Open `/public/ai?q=hello` (or just `/public/ai`).**
   *Passes when:* "Mitron" chat opens from the bottom (~60% height) and you can
   swipe/drag it to full screen.

2. **D2 — Tap "What should I pack?"**.
   *Passes when:* a checklist card appears (medicines, documents, charger,
   dry food, water).

3. **D3 — Ask "Where is the nearest shelter?"**
   *Passes when:* you get a small map snippet plus a list card with a
   "Navigate" button.

4. **D4 — Ask "Is [some road] open?"**
   *Passes when:* a road-status card appears using the road-closure database.

5. **D5 — Microphone (supported).** Tap the mic and speak.
   *Passes when:* your speech appears as text and a "Listening…" waveform shows.

6. **D6 — Microphone not supported.** (Simulate by blocking mic permission.)
   *Passes when:* a ~1.2 second canned response plays instead — and no crash.

7. **D7 — Language preference.** Set your language (e.g. Hindi) in the settings.
   *Passes when:* Mitron answers in that language.

8. **D8 — Offline mode.** Turn off Wi-Fi and ask a question.
   *Passes when:* a "Limited responses" badge appears and a local FAQ still answers.

9. **D9 — Feedback.** Thumbs 👍/👎.
   *Passes when:* feedback is captured (confirmation shown).

10. **D10 — On a desktop browser.**
    *Passes when:* the sheet and chat work fine at full width.

---

# Section E — Alerts & the Notification Centre
*What this is:* where emergency alerts are created, sent, and acknowledged.

**Tester's tool:** Laptop (E12 on Mobile).
**Log in as:** Government official (or guest).

1. **E1 — Simulate a critical alert.** On the command centre, find
   "Simulate Critical Alert" and press it.
   *Passes when:* a new critical alert row is created and shows up in the feed.

2. **E2 — Open `/alerts`.**
   *Passes when:* a table shows alerts with severity / channel / district
   badges, and a count header.

3. **E3 — Acknowledge an alert.** Pick an unacknowledged alert, click
   acknowledge.
   *Passes when:* it's marked acknowledged (badge/icon changes), the
   unacknowledged count drops, and your name is recorded.

4. **E4 — Bell badge.** Look at the bell icon in the sidebar.
   *Passes when:* it shows the number of unacknowledged alerts. (Demo fallback
   usually shows 2.)

5. **E5 — Alert ticker.** Top of the dashboard.
   *Passes when:* critical alert text scrolls across the top.

6. **E6 — No duplicate alerts.** Re-trigger the same critical alert within 6 hours.
   *Passes when:* only ONE log entry exists — it's deduplicated.

7. **E7 — Placeholders filled.** Send an alert with placeholders.
   *Passes when:* the message shows the real district / risk level / time, not
   {bracket} text.

8. **E8 — Filter by severity.** Use the filter on the alerts page.
   *Passes when:* list filters to critical / warning / info as chosen.

9. **E9 — Alert in a non-English language.** With a language set, trigger an alert.
   *Passes when:* SMS path shows translation is attempted (falls back to English
   if no key — and doesn't crash).

10. **E10 — Demo SMS.** Send an SMS while in demo mode.
    *Passes when:* the message writes "sid demo-bypass" and/or logs to the
    terminal — real Twilio is NOT called.

11. **E11 — Notifications (push).** Allow push notifications.
    *Passes when:* subscription is stored; clicking a notification opens
    the right page.

12. **E12 — Alerts on a phone.**
    *Passes when:* table scrolls sideways without breaking the page.

---

# Section F — Login, Logout & "Who sees what"
*What this is:* every way to log in, and the rules for which role sees which pages.

**Tester's tool:** Laptop + Mobile.

1. **F1 — Landing page Sign In button.** Open `/` and click "Sign In".
   *Passes when:* you're taken to `/login`.

2. **F2 — Guest login.** On /login click "Continue as Guest (Demo)".
   *Passes when:* you land on /command-center in guest mode.

3. **F3 — Guest dashboard is "lite".**
   *Passes when:* you see the field-responder view (activity feed, alerts,
   sitrep, alert simulator) and NOT the full heavy admin widget set.

4. **F4 — Enable guest public access.** Turn on the guest/public access option.
   *Passes when:* role becomes public and lands on `/public/dashboard` with a
   "GUEST MODE" banner.

5. **F5 — Government login.** Any email + password on /gov/login.
   *Passes when:* you reach /gov/dashboard and a badge shows "ROLE ·
   DISTRICT_ADMIN".

6. **F6 — Government sign-up.** Open /gov/signup.
   *Passes when:* org dropdown + ID-upload fields are present, plus an
   "approval flow" notice.

7. **F7 — Public OTP login.** On /public/login, enter a phone number.
   *Passes when:* a 6-digit OTP step asks for the code; ANY code works for demo;
   you land on /public/onboarding and see a masked phone number.

8. **F8 — Responder OTP login.** On /login, use the passwordless box.
   *Passes when:* valid phone → "OTP sent" and the code is printed in the
   *terminal window*.

9. **F9 — OTP spam guard.** Try sending an OTP 4 times quickly (within ~10 min).
   *Passes when:* you get "Too many OTP requests. Wait a few minutes."

10. **F10 — Wrong OTP.** Enter an invalid code.
    *Passes when:* "Invalid or expired code. Request a new one."

11. **F11 — Logout.** Click the logout icon.
    *Passes when:* you're sent to /login and cookies/session are cleared.

12. **F12 — Citizen hits government page.** While logged in as public, open
    `/gov/dashboard`.
    *Passes when:* you're redirected to `/public/dashboard`.

13. **F13 — Government hits citizen page.** As a gov user, open `/public/dashboard`.
    *Passes when:* redirected back to `/gov/dashboard`.

14. **F14 — "View as Public" toggle.** Switch it on, open /public/dashboard.
    *Passes when:* a PREVIEW MODE banner stays visible, and the toggle takes you
    back to /gov/dashboard when off.

15. **F15 — No database (cookie-only auth).** If your `.env` has no Supabase keys.
    *Passes when:* dashboards still open (cookie-only mode).

16. **F16 — Not logged in.** Open any protected page in a fresh/private window.
    *Passes when:* you're redirected to `/login?next=…` (remembering where you
    wanted to go).

---

# Section G — Bulk Actions & Simulation Mode
*What this is:* doing things to many districts at once, safely in a sandbox.

**Tester's tool:** Laptop.
**Log in as:** Government official.

1. **G1 — Edit a district's flood thresholds.** `/districts`, move sliders, save.
   *Passes when:* saved with no error.

2. **G2 — Toggle simulation mode.** Flip the simulation switch.
   *Passes when:* sandbox runs; real (production) data untouched.

3. **G3 — Bulk mass alert.** In /bulk-ops, run a mass alert across districts.
   *Passes when:* alert entries are created for all target districts.

4. **G4 — Simulation done banner.**
   *Passes when:* after the scenario runs, a summary banner appears.

---

# Section H — Command Centre (the main control room)
*What this is:* the big monitoring wall — maps, numbers, feeds, charts.

**Tester's tool:** Laptop; H15/H16 on tablet/phone.

1. **H1 — Guest view.** Log in as guest, open `/command-center`.
   *Passes when:* you see LiveActivityFeed, FieldTasksPlaceholder, SitRep and
   an AlertSimulator (the "field" widget set).

2. **H2 — Admin view.** Log in as government official.
   *Passes when:* you see the full set — DataHealth, ShelterCapacity, LowStock,
   GapAnalysis, Charts, DisasterTimeline.

3. **H3 — Big number cards.**
   *Passes when:* stat cards render big numbers (risk, people at risk, shelters,
   resources).

4. **H4 — Live map widget.**
   *Passes when:* the map canvas is actually visible inside the dashboard.

5. **H5 — Active alerts feed.**
   *Passes when:* recent alerts list with severity colours and time-ago.

6. **H6 — AI suggestion card.**
   *Passes when:* latest AI suggestion shows, plus an "Open AI Planner" button
   and thumbs.

7. **H7 — Responder status board.**
   *Passes when:* avatars with green/red online dots.

8. **H8 — Flood timeline chart.** 72-hour area chart with a threshold line.
   *Passes when:* it loads (a skeleton shows first, then the chart fills in).

9. **H9 — Resource donut chart.**
   *Passes when:* a donut/pie shows category usage.

10. **H10 — Broadcast message.** Type a message and send (admin view).
    *Passes when:* responders can see it (check field view / activity feed).

11. **H11 — SitRep generator.** Click the SitRep button.
    *Passes when:* a printable situation-report page opens.

12. **H12 — Alert simulator.** Click it.
    *Passes when:* a forced critical alert is generated.

13. **H13 — Data health widget.**
    *Passes when:* shows last-fetch time and a green/amber/red status.

14. **H14 — Offline banner.** Turn off the network.
    *Passes when:* an amber "Offline" banner drops down from the top.

15. **H15 — Tablet width.**
    *Passes when:* grid becomes 2 columns and widgets stay readable.

16. **H16 — Phone width.**
    *Passes when:* single column stack, no sideways scrolling.

---

# Section I — Citizen Reports & Checking Them
*What this is:* citizens report floods/problems; admins check (triage) them.

**Tester's tool:** Mobile (I1–I3, I10); Laptop (I4–I9).

1. **I1 — Citizen report form.** On `/public/report`, report flooding with GPS +
   a photo and submit.
   *Passes when:* success message + status = "unverified".

2. **I2 — Spammy report.** Paste obvious bot/spam text and submit.
   *Passes when:* the report is rejected by spam checks and NOT created.

3. **I3 — Safe text.** Submit a report containing code/script-looking text
   (e.g. a <script> tag).
   *Passes when:* the stored text has the script tags stripped (no raw code).

4. **I4 — Triage queue.** Log in as government official, open `/triage`.
   *Passes when:* the mock queue lists unverified reports.

5. **I5 — Verify a report.**
   *Passes when:* status changes to verified and the map icon becomes ✓.

6. **I6 — Reject a report.**
   *Passes when:* status → rejected and it leaves the live queue.

7. **I7 — Dispatch a drone.** Click "Dispatch drone".
   *Passes when:* a mock dispatch is triggered.

8. **I8 — Map markers.** Watch the map.
   *Passes when:* unverified reports show "?", verified show ✓.

9. **I9 — Social media ingest.** Call the ingest endpoint (terminal-friendly)
   — or find its button.
   *Passes when:* fake social posts appear as new reports.

10. **I10 — Triage on mobile.**
    *Passes when:* rows are touch-friendly and tappable.

---

# Section J — Data, Weather & System Health
*What this is:* checking that live/simulated data flows and health stays green.

**Tester's tool:** Laptop.
**Log in as:** any.

1. **J1 — Data freshness.**
   *Passes when:* the data-health widget shows last successful fetch time, and
   turns amber/red when stale.

2. **J2 — Manual refresh.** Press the refresh button.
   *Passes when:* ingestion runs and freshness updates.

3. **J3 — Weather endpoint.** Visit `/api/weather`.
   *Passes when:* JSON returns (live if available, else a fallback) — never a
   500 error.

4. **J4 — Flood endpoint.** Visit `/api/flood`.
   *Passes when:* a risk-level payload returns.

5. **J5 — Live conditions.** Visit `/api/live-conditions`.
   *Passes when:* a conditions object returns.

6. **J6 — Prediction endpoint.** Visit `/api/predict`.
   *Passes when:* prediction with risk + confidence returns (or fallback).

7. **J7 — Cron ingest.** Visit `/api/cron/ingest`.
   *Passes when:* completes without throwing; data sources updated.

8. **J8 — Impossible data is rejected.** (Simulate crazy rainfall, e.g. via
   ingestion controls.)
   *Passes when:* absurd values get dropped or interpolated, not stored.

9. **J9 — Health page.** Open `/health`.
   *Passes when:* API status cards show green/amber/red with a last-ping time.

10. **J10 — ML service down.** (If the ML service is off.)
    *Passes when:* the system falls back to a calculated "heuristic"
    prediction instead of crashing.

---

# Section K — Evacuations, Routes & Road Closures
*What this is:* planning how villages evacuate, and routing around closed roads.

**Tester's tool:** Laptop; K10 on Mobile.

1. **K1 — Open `/evacuations` after a demo reset.**
   *Passes when:* 2 seeded plans: "Ganga Floodplain Village" (in_transit) and
   "Kankarbagh North" (pending).

2. **K2 — Kanban board.**
   *Passes when:* three columns render: pending / in_transit / completed.

3. **K3 — Move a plan forward.** Drag/advance a plan to "in_transit".
   *Passes when:* status updates and stays after refresh.

4. **K4 — Complete a plan.**
   *Passes when:* status becomes "completed".

5. **K5 — Add a road closure.**
   *Passes when:* a marker appears and evacuation routes recalculate around it.

6. **K6 — Deactivate the same closure.**
   *Passes when:* the route goes back / re-enables.

7. **K7 — Mass evacuation assignment.**
   *Passes when:* villages get assigned to the nearest shelter with capacity.

8. **K8 — Route lines.** Look at the map.
   *Passes when:* evacuation route lines render with arrows/labels.

9. **K9 — Fleet optimizer.**
   *Passes when:* vehicles get assigned so total time is minimized, with no
   "unmet demand" crash.

10. **K10 — Progress tracker on a phone.** Update a field status.
    *Passes when:* the change reflects on the gov evac list.

---

# Section L — Field Responder Mobile App
*What this is:* the app for workers on the ground.

**Tester's tool:** Mobile (L16 on Laptop).

1. **L1 — Open `/field`.**
   *Passes when:* an "On duty" AMBER WATCH greeting banner shows.

2. **L2 — Quick actions.**
   *Passes when:* tiles: Update Shelter / Request Resources / Report Hazard /
   Deployment Map.

3. **L3 — Update shelter occupancy.** Open `/shelter-update`.
   *Passes when:* an occupancy gauge; +/− buttons adjust it instantly
   (optimistic update).

4. **L4 — Update occupancy while offline.** Turn off Wi-Fi and adjust.
   *Passes when:* the change is queued instantly (optimistic), and a
   "SyncStatusBadge" shows pending.

5. **L5 — Request resources.** Open `/request-resources`, pick category +
   quantity, submit.
   *Passes when:* a resource-request row appears (status pending).

6. **L6 — GPS check-in.** Tap the check-in button.
   *Passes when:* location is captured (falls back to Patna Centre) and logged.

7. **L7 — Voice note.** Tap the mic and speak.
   *Passes when:* transcript fills the notes field with a waveform animation.

8. **L8 — Damage report with photo.** Open the damage modal, add photo +
   location, submit.
   *Passes when:* submitted successfully.

9. **L9 — Task list.**
   *Passes when:* prioritized tasks appear, tappable to change status.

10. **L10 — Emergency recall.** Press the test "Emergency Recall" button.
    *Passes when:* an Emergency Recall banner appears.

11. **L11 — Task dispatch test.** Press the dispatch test button.
    *Passes when:* a new critical assignment appears.

12. **L12 — SOS panic button.** Press and HOLD it for 2 seconds.
    *Passes when:* a progress ring fills up; releasing early cancels; holding
    full sends the SOS (POST to server).

13. **L13 — SOS offline.** Hold the SOS while offline.
    *Passes when:* it's queued and replays when you reconnect.

14. **L14 — CALL NOW.** Tap "Call" to the control room.
    *Passes when:* the phone dialer opens with the control-room number.

15. **L15 — Deployment map.** Open the field map.
    *Passes when:* live zones render.

16. **L16 — On a desktop browser.**
    *Passes when:* the field shell works (narrow centered column).

---

# Section M — Inventory & Resources
*What this is:* tracking supplies (tents, meds, boats…) and who gets them.

**Tester's tool:** Laptop; M13 on Mobile.

1. **M1 — Open `/inventory` after demo reset.**
   *Passes when:* table of resources with category/status; 5 seeded rows.

2. **M2 — Add a resource.**
   *Passes when:* new row appears and shows up in map depots.

3. **M3 — Edit quantity/status.** Change a resource.
   *Passes when:* change persists and the status badge updates.

4. **M4 — CSV import.** Use the import control with a CSV file.
   *Passes when:* rows bulk-create/update.

5. **M5 — Approve a field request.** Have a field request; approve it on
   `/dispatch`.
   *Passes when:* it becomes fulfilled + allocated.

6. **M6 — Record a movement.** Move stock depot → site.
   *Passes when:* a movement trail entry appends with timestamp.

7. **M7 — Low-stock flag.**
   *Passes when:* resources under the threshold (default 10) get flagged.

8. **M8 — Run allocation optimization.**
   *Passes when:* a plan is returned sorted by priority, with a list of
   unmet-demand gaps.

9. **M9 — What-if simulator.** Change availability and re-run.
   *Passes when:* plan re-optimizes and shows a comparison/delta.

10. **M10 — Deployment timeline.** Check the 24–48h schedule view.
    *Passes when:* a timeline/Gantt renders.

11. **M11 — Lock items then re-optimize.** Lock a row, re-run optimization.
    *Passes when:* locked rows are kept, the rest re-optimizes.

12. **M12 — Donut by category.**
    *Passes when:* availability vs deployed segments render.

13. **M13 — Approve/reject on mobile.**
    *Passes when:* touch targets work.

---

# Section N — Knowledge Base (searching emergency documents)
*What this is:* a library of PDFs/plans that the AI can search.

**Tester's tool:** Laptop; N8 on Mobile.

1. **N1 — Open `/knowledge-base`.**
   *Passes when:* documents list with a doc_type (plan / notice).

2. **N2 — Upload a PDF.**
   *Passes when:* it's chunked + embedded; if no API key → it skips gracefully
   (NO 500 error).

3. **N3 — Search.** Visit `/api/rag/search?q=evacuation protocol`.
   *Passes when:* top results return (real or mock fallback).

4. **N4 — District-scoped results.**
   *Passes when:* only docs belonging to your district come back.

5. **N5 — Backfill embeddings.**
   *Passes when:* docs with missing embedding get filled (limit 50) and the
   version bumps.

6. **N6 — AI planner shows sources.** In the AI planner Sources panel.
   *Passes when:* referenced document titles/links are listed.

7. **N7 — Run the eval script.** In terminal:
   ```
   npm run eval:retrieval
   ```
   *Passes when:* a "Recall" score prints for sample queries.

8. **N8 — On mobile.**
   *Passes when:* list + upload work.

---

# Section O — The Landing / Marketing Page
*What this is:* the "front door"/homepage that sells the product.

**Tester's tool:** Laptop; O9 on Mobile.

1. **O1 — Open `/`.**
   *Passes when:* title "Disaster Response Intelligence…" and a full hero section.

2. **O2 — Sign In button.**
   *Passes when:* click → `/login`.

3. **O3 — Problem / Solution.**
   *Passes when:* flood-loss story + the solution section text are visible.

4. **O4 — Features / How It Works.**
   *Passes when:* module cards render.

5. **O5 — Impact / Tech stack.**
   *Passes when:* stats + stack chips render.

6. **O6 — Command Centre preview.**
   *Passes when:* a mock command-UI snapshot is visible.

7. **O7 — FAQ accordion.** Click a question.
   *Passes when:* it toggles open/closed.

8. **O8 — Contact.**
   *Passes when:* the district control-room number is displayed.

9. **O9 — On a phone.**
   *Passes when:* single column, nothing overflows, Sign In tappable.

---

# Section P — The Live Map & Layers
*What this is:* the interactive map with flood zones, shelters, tools.

**Tester's tool:** Laptop; P13/P14 on tablet/phone.

1. **P1 — Open `/map`.**
   *Passes when:* fullscreen map covers the page; the map canvas itself is
   visible.

2. **P2 — Default layers.**
   *Passes when:* Flood Risk Zones, Shelters, Resources are all ON.

3. **P3 — Toggle off "Flood Risk Zones".**
   *Passes when:* the coloured zones disappear and the toggle unchecks.

4. **P4 — Time slider.** Drag 0 → 72h.
   *Passes when:* flood shapes change per forecast hour.

5. **P5 — Click the "Patna Central Shelter" marker.**
   *Passes when:* an info panel shows name, Sector 4 · Ward 12, 450/500, Open.

6. **P6 — Legend.**
   *Passes when:* a severity colour key shows.

7. **P7 — Search bar.** Type a village or a coordinate.
   *Passes when:* the map flies to that location.

8. **P8 — Distance tool.** Use "measure" and click two points.
   *Passes when:* distance in km is computed.

9. **P9 — Right-click on the map.**
   *Passes when:* a context menu opens at the cursor; clicking elsewhere closes it.

10. **P10 — Presentation mode.** Click Maximize.
    *Passes when:* extra chrome disappears, "Press Esc to exit…" hints show,
    and Esc restores everything.

11. **P11 — Mini-map.** (Wide screens.)
    *Passes when:* a small overview box pans the main map.

12. **P12 — Live cursors.**
    *Passes when:* other viewers' cursors appear (local demo).

13. **P13 — Tablet.**
    *Passes when:* overlays usable, nothing bleeds outside the frame.

14. **P14 — Phone.**
    *Passes when:* the map fills the screen and toggles are accessible.

---

# Section Q — Languages & Alert Translation
*What this is:* the app in English + 22 Indian languages.

**Tester's tool:** Laptop; Q9 on Mobile.

1. **Q1 — Language selector** on the gov dashboard.
   *Passes when:* a dropdown lists English + 22 Indian languages.

2. **Q2 — Switch to हिन्दी (Hindi).**
   *Passes when:* nav, alerts, inventory labels become Hindi.

3. **Q3 — Switch to മലയാളം (Malayalam).**
   *Passes when:* labels translate to Malayalam.

4. **Q4 — Preference saved.** Reload the page.
   *Passes when:* the language stays the same.

5. **Q5 — Missing translation.**
   *Passes when:* untranslated text falls back to English (no blank tags).

6. **Q6 — SMS translate target = English.**
   *Passes when:* the translator just sends English back unchanged.

7. **Q7 — SMS translate target = Hindi without a key.**
   *Passes when:* translation "fails open" to English and logs the attempt —
   no crash.

8. **Q8 — Translated alerts heading.** On the alerts page, with a locale set.
   *Passes when:* "Alert History" heading appears in the chosen language.

9. **Q9 — Language switch on mobile public app.**
   *Passes when:* citizen UI + AI answers follow the chosen language.

---

# Section R — Public Alerts (for citizens)
*What this is:* the alerts feed ordinary people see.

**Tester's tool:** Mobile; R9 on Laptop.

1. **R1 — Open `/public/alerts`.**
   *Passes when:* chronological alert cards with severity colour + icons.

2. **R2 — Filter tabs.**
   *Passes when:* All / My Area / District / State switch the list.

3. **R3 — Tap an alert.**
   *Passes when:* detail view = message + recommended actions + shelters + share.

4. **R4 — Swipe to mark read.**
   *Passes when:* the row dismisses and the unread badge updates.

5. **R5 — Critical alert in your area.**
   *Passes when:* full-screen EVACUATE overlay with alarm/vibration and a
   countdown.

6. **R6 — "Show Me Where to Go".**
   *Passes when:* opens `/public/map` with routing.

7. **R7 — "I Need Help".**
   *Passes when:* sends an SOS to the control room + family.

8. **R8 — Alert preferences.** Open `/public/settings/alerts`.
   *Passes when:* severity threshold + channel toggles save.

9. **R9 — On desktop.**
   *Passes when:* same list renders at full width.

---

# Section S — Citizen Home Dashboard
*What this is:* the citizen's personal home screen.

**Tester's tool:** Mobile; S15 on Laptop.

1. **S1 — Open `/public/dashboard`.**
   *Passes when:* "Citizen Portal" header + a red pulsing dot.

2. **S2 — Safety status card.**
   *Passes when:* a massive SAFE / WATCH / PREPARE / EVACUATE status
   (auto-detected from your area).

3. **S3 — Action button.**
   *Passes when:* the button changes per status (forecast / readiness /
   routes / GO TO SHELTER).

4. **S4 — Weather forecast carousel.**
   *Passes when:* swipeable 3-day cards with rainfall + risk badge.

5. **S5 — Family strip.**
   *Passes when:* member avatars with status dots; tap one → "Are you safe?"
   nudge.

6. **S6 — Nearby shelters.**
   *Passes when:* exactly 3 shelters with distance, walk time, occupancy.

7. **S7 — Emergency dial.**
   *Passes when:* 4 speed-dial squares (Control room / Police / Ambulance /
   Fire) using tel: links.

8. **S8 — Module grid.**
   *Passes when:* SOS Report / Live Alerts / Nearby Shelters / Family Circle.

9. **S9 — AI teaser pills.**
   *Passes when:* tapping opens `/public/ai?q=…`.

10. **S10 — Pull to refresh.** Pull down the dashboard.
    *Passes when:* a shield spinner shows → "Last updated" refreshes.

11. **S11 — Bottom nav.**
    *Passes when:* Home is highlighted; SOS opens a modal (no navigation).

12. **S12 — Add family member.** Go to setup family.
    *Passes when:* a contact persists after saving.

13. **S13 — Set your location.**
    *Passes when:* district/village saves.

14. **S14 — Identity header.**
    *Passes when:* shows "GUEST MODE" / "NOT SIGNED IN" / masked
    +91 ••••xxxx as appropriate.

15. **S15 — On desktop.**
    *Passes when:* the phone-style frame stays centered and intact.

---

# Section T — Public Map & Getting to Shelters
*What this is:* navigation to safe zones for citizens.

**Tester's tool:** Mobile.

1. **T1 — Open `/public/map`.**
   *Passes when:* map centered on you with a pulsing user-dot.

2. **T2 — Tap a shelter marker.**
   *Passes when:* bottom sheet snaps (25/60/95%) showing name, distance,
   capacity, facilities.

3. **T3 — "Navigate Here".**
   *Passes when:* turn-by-turn view with a big arrow + voice prompts.

4. **T4 — Danger zones.**
   *Passes when:* flood areas show a red overlay; safe areas stay transparent.

5. **T5 — Road-closure X markers.** Tap one.
   *Passes when:* "Road Closed — Alternative route available" + reroute.

6. **T6 — Recenter button.**
   *Passes when:* tapping the FAB re-centers the map on you.

7. **T7 — Report button "+".**
   *Passes when:* you can report flooding / blocked / trapped / shelter full
   with GPS + photo.

8. **T8 — Offline map tiles.**
   *Passes when:* cached district tiles show an "Offline Map Active" badge.

---

# Section U — SOS & Emergency Mode
*What this is:* panic buttons and help for citizens.

**Tester's tool:** Mobile.

1. **U1 — Tap the SOS tab.**
   *Passes when:* an SOS action sheet (2 columns × 3 rows) opens — no
   navigation.

2. **U2 — "I Need Rescue".**
   *Passes when:* a 3-second countdown; tap again to confirm → GPS is sent to
   control room + family.

3. **U3 — Cancel mid-countdown.**
   *Passes when:* the action aborts; nothing is sent.

4. **U4 — "Medical Emergency".**
   *Passes when:* countdown → dispatch to ambulance + control room.

5. **U5 — "Share My Location".**
   *Passes when:* a live-tracking link + "Sharing Location — time remaining"
   banner.

6. **U6 — "Call Emergency Helpline".**
   *Passes when:* the dialer opens with 108 / 112 / NDRF numbers.

7. **U7 — "I Am Safe".**
   *Passes when:* safety broadcasts to the family strip and their dots update.

8. **U8 — Emergency mode UI.**
   *Passes when:* a red tint banner appears; nav simplifies to Map / SOS / Alerts.

9. **U9 — Nearest help during SOS.**
   *Passes when:* shelter / hospital / NDRF listed with one-tap navigate/call.

10. **U10 — SOS history.**
    *Passes when:* past SOS events show with resolution status.

---

# Section V — Live Updates & Collaboration
*What this is:* things updating in real time as multiple people use the app.

**Tester's tool:** Laptop; V7 on Mobile.

1. **V1 — Live activity feed.** Watch the command centre feed.
   *Passes when:* new events append live (prediction, shelter full, resource
   deploy).

2. **V2 — Broadcast message.**
   *Passes when:* admin sends → it's logged and delivered visibly.

3. **V3 — Presence.** 
   *Passes when:* online responders show green status dots.

4. **V4 — Conflict resolver demo.** Trigger two people editing the same shelter.
   *Passes when:* the merge resolves without error (last-write / merge logic).

5. **V5 — Sync freshness.**
   *Passes when:* "Last updated X min ago" shows, with a manual refresh button.

6. **V6 — No realtime websockets.**
   *Passes when:* it falls back to polling and data still updates.

7. **V7 — Citizen live updates on mobile.**
   *Passes when:* dashboard status refreshes on pull or on an interval.

---

# Section W — Settings & Preferences (Gov)
*What this is:* the personal/org settings pages.

**Tester's tool:** Laptop; W17 on Mobile.

1. **W1 — Profile edit.** `/settings/profile`, change a field, save.
   *Passes when:* saved (validated), and the email is read-only "Verified".

2. **W2 — Weak password.** Try a short / no-digit / no-uppercase password.
   *Passes when:* the form shows an error and blocks it.

3. **W3 — Mismatched passwords.**
   *Passes when:* "Passwords do not match".

4. **W4 — Avatar upload.**
   *Passes when:* crop/compress works and a public URL saves.

5. **W5 — Notification toggles.**
   *Passes when:* In-App / Push / Email / SMS states per category persist.

6. **W6 — Do-Not-Disturb schedule.**
   *Passes when:* it saves (with a "critical alerts still override" note).

7. **W7 — AI provider choice.** Settings → AI.
   *Passes when:* OpenRouter/Groq/other radio saves in localStorage and is sent
   on queries.

8. **W8 — AI verbosity slider.**
   *Passes when:* persists.

9. **W9 — Plan approval mode.**
   *Passes when:* auto / suggest / disabled persists.

10. **W10 — Map layer settings.** To change layers + opacity.
    *Passes when:* they persist and sync across tabs.

11. **W11 — Colourblind mode.**
    *Passes when:* severity patterns / orange-blue palette apply.

12. **W12 — Offline cache size.**
    *Passes when:* 100 / 500 / 1000 / 2000 MB option saves.

13. **W13 — Data export.**
    *Passes when:* a JSON/CSV download of personal data starts.

14. **W14 — Emergency contacts + test message.**
    *Passes when:* add/edit/delete works and a "test" message can be sent.

15. **W15 — Integrations status.** Weather API status page.
    *Passes when:* IMD / OWM / GLOFAS / CWC show green/amber/red.

16. **W16 — Org district thresholds (admin).**
    *Passes when:* saves to config without error.

17. **W17 — Settings on mobile.**
    *Passes when:* category tabs at top, content below, all usable.

---

# Section X — Shelters & Facilities
*What this is:* managing all the shelters.

**Tester's tool:** Laptop; X9 on Mobile.

1. **X1 — Open `/shelters`.**
   *Passes when:* table rows: name, capacity, occupancy, status, facilities.

2. **X2 — Add a shelter.**
   *Passes when:* form validates lat/lng/capacity → row + map marker appear.

3. **X3 — Edit shelter + auto-full.**
   *Passes when:* status flips to full when occupancy reaches capacity.

4. **X4 — CSV import.**
   *Passes when:* rows bulk-create/update.

5. **X5 — Nearest shelter API.** Visit `/api/shelters/nearest` (with location).
   *Passes when:* results sorted by distance (nearest first).

6. **X6 — Occupancy update.** Update a shelter's occupancy.
   *Passes when:* the capacity widget recomputes.

7. **X7 — Shelter map popup.** Click a shelter on the map.
   *Passes when:* popup shows occupancy + contact + directions actions.

8. **X8 — Shelter capacity warning.** When occupancy ≥80%.
   *Passes when:* the widget shows an amber warning.

9. **X9 — On mobile.**
   *Passes when:* rows/cards are usable on a phone screen.

---

## 🏁 Done! 

Total: 24 sections, ~150 quick tests. Tally your ✅ marks:

- **150 / 150** → Full pass, gold-star demo. 🏆
- **140+** → Excellent; note the failures and retest before show day.
- **Under 130** → Run `npm run demo:reset`, refresh, and retest — many "failures"
  are just stale demo data.