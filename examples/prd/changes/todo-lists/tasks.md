# Tasks — todo-lists

Each task targets `examples/prd-propose/todo-lists.md` (the PRD file does not yet exist; the first task creates it from the `builtin/prd@1` template). Tasks are atomic so `prd-apply` can execute them without inventing content; the concrete text to write is included inline.

No tasks have been applied yet, so all edits in this clarify pass were made in place (no strikethrough required per `prd/SKILL_DESIGN.md` §6.1).

## Create

- [ ] Create `examples/prd-propose/todo-lists.md` as a copy of the `builtin/prd@1` template, with the title set to "Anonymous TODO Lists".

## Section 1 — Context

- [ ] Section 1.1 Background: replace placeholder with "An anonymous, free web TODO app for short-lived lists — packing for a trip, prepping for a meeting, running errands. Built deliberately around a 24-hour list lifetime so users never accumulate stale TODOs."
- [ ] Section 1.2 Strategic Rationale: write:
  - **Why now**: Permanent task managers dominate the category; the underserved shape is the explicitly temporary, no-account list for a single sitting.
  - **Alignment**: Demo project — alignment is with the PRD skill family's testing needs, not a broader product roadmap.
  - **Dependencies**: None. The product is self-contained.

## Section 2 — Product Overview

- [ ] Section 2 Product Overview: replace placeholder with the three-question answers:
  - **What does it do?** Lets a visitor create and manage a handful of TODO lists from the browser, with no sign-in. Each list disappears 24 hours after it is created.
  - **Who is it for?** Anyone with a short-lived TODO need that does not justify creating an account or installing an app — a packing list, a meeting agenda, a day's errands.
  - **What problem does it solve?** Replaces the bad trade between heavy task managers (too much friction for a half-day need) and notes apps (which accumulate stale items forever) with a deliberately temporary alternative.

## Section 3 — Goals and Objectives

- [ ] Section 3.1 Business Goals: write:
  - **Validate ephemerality as a product feature**: Demonstrate that an explicitly temporary, no-account TODO surface has a coherent user audience.
  - **Provide a reference implementation for the PRD skill family**: The shipped product doubles as the demo artifact used to exercise propose / clarify / apply / archive.
- [ ] Section 3.2 Objectives and Key Results (OKR): write:
  1. **Visitors get into flow within a minute of arriving.**
     - **Key Result**: Add-to-first-item time — target: ≥50% of new sessions add at least one item within 60s of arrival, baseline: 0 (new product), frequency: weekly cohort, measured server-side from anonymous session creation.
  2. **Users do not lose data by surprise.**
     - **Key Result**: Visible-expiration coverage — target: 100% of lists show remaining lifetime in the UI, baseline: 0, frequency: per release (manual UX check).

## Section 4 — Core Concepts and Terminology

- [ ] Section 4.1 List: write "A named container of items. A user can have many lists at once. Each list is private to the browser session that created it and is automatically deleted 24 hours after creation. Lists are created, renamed, and deleted by the user."
- [ ] Section 4.2 Item state: write the two states and their transitions:
  - **Open** — the default state when an item is added; appears in the active view of its list.
  - **Completed** — set by the user via the one-motion completion control; rendered de-emphasized; can be reverted to Open by toggling again.
  - Transitions: Open ↔ Completed (toggled by the user); either state → removed (by the user via the delete affordance on the item, or by the system when the list reaches its 24-hour expiration).
- [ ] Section 4.3 Adding and completing an item (workflow): write the happy path:
  - **Add** — user types text in the active list's input and presses Enter; the item appears at the bottom of the list in Open state; focus stays in the input.
  - **Complete** — user clicks/taps the item's checkbox; the item moves to Completed state; if the "hide completed" toggle is on, the item disappears from view.
  - **Edit** — user clicks/taps the item text; the row becomes editable; Enter commits, Escape cancels.
  - **Remove** — user activates the item's delete affordance; the item is removed immediately, no confirmation.
  - **Expire** — without any user action, all of a list's items vanish 24 hours after the list was created (see Section 7).

## Section 5 — Target Users

- [ ] Section 5.1 Personas: render as `N/A — no shared personas.md exists for this corpus; persona captured inline in 5.2.`
- [ ] Section 5.2 PRD-specific personas: write a single inline persona:
  - **Short-sitting list-keeper** — has a TODO need bounded to roughly one sitting or one day (packing, meeting prep, errands, brainstorm). Wants to type a few things, check most off in the next few hours, and walk away. Does not want an account, sync, settings, or a permanent list that will be 80% stale next month.
- [ ] Section 5.3 User Research Insights: render as `Omit` (no research conducted; section not rendered).

## Section 6 — Product Capabilities

### 6.1 Core list workflow

- [ ] Section 6.1.1 Quick capture: write the capability description from `intent.md` (capability 1), with:
  - **Rules:**
    - The active list always has an item input focused or focusable by a single Tab from the document body.
    - Pressing Enter in the input commits the typed text as a new Open item and clears the input.
    - The input retains focus after commit so the next item can be typed without a pointer action.
    - An empty input commits nothing.
  - **Priority:** High
- [ ] Section 6.1.2 One-motion completion: write the capability description from `intent.md` (capability 2), with:
  - **Rules:**
    - Each item exposes a single control (checkbox or equivalent tap target) that toggles between Open and Completed.
    - No confirmation is shown when toggling.
    - Toggling a Completed item back to Open is supported and reversible.
  - **Priority:** High
- [ ] Section 6.1.3 Multiple named lists: write the capability description from `intent.md` (capability 3), with:
  - **Rules:**
    - The user may create an unbounded number of lists per session (rate limits notwithstanding — see Section 10).
    - A persistent navigation surface (sidebar on desktop; equivalent on mobile) shows every list and which one is active.
    - Switching the active list is a single click or tap.
    - Each new list is created with a user-supplied name; an unnamed list is not allowed.
- [ ] Section 6.1.4 Ephemeral session storage: write the capability description from `intent.md` (capability 4), with:
  - **Rules:**
    - Lists and items are stored on the product's servers; no list content is written to the user's device.
    - List access is bound to the active browser session. Opening the app in a different browser or device shows a fresh start.
    - Within the 24-hour list lifetime, the user can continue working with their lists from the same session.
  - **Priority:** High

### 6.2 List management

- [ ] Section 6.2.1 Visible expiration: write the capability description from `intent.md` (capability 5), with:
  - **Rules:**
    - Every list displays its remaining lifetime (e.g., "expires in 18h") visible on the list itself, not hidden behind a menu.
    - The remaining-time display updates at least once per minute while the list is in view.
    - When a list is within one hour of expiration, the display is visually emphasized (color or weight change) to draw attention.
    - There is no way to extend a list's lifetime; the user cannot opt out of expiration.
  - **Priority:** High
- [ ] Section 6.2.2 In-place editing: write the capability description from `intent.md` (capability 6), with:
  - **Rules:**
    - Clicking or tapping a list name or item text turns the element into an editable field with the cursor placed at the click point.
    - Enter commits the edit; Escape cancels and restores the prior value.
    - Committing an empty list name reverts to the prior name; committing an empty item text deletes the item.
  - **Priority:** Medium
- [ ] Section 6.2.3 Hide completed items: write the capability description from `intent.md` (capability 7), with:
  - **Rules:**
    - Each list exposes a toggle that switches between "show completed" and "hide completed".
    - The toggle state is remembered per-list across views within the same session.
    - Default state on first view of a list is "show completed", with completed items rendered de-emphasized (strikethrough + reduced opacity).
  - **Priority:** Medium
- [ ] Section 6.2.4 Remove items and lists: write the capability description from `intent.md` (capability 8), with:
  - **Rules:**
    - Each item has a delete control that removes the item immediately, with no confirmation.
    - Each list has a delete control that shows a lightweight confirmation naming the list and its item count before removing the list.
    - Deleting a list removes all of its items immediately, independent of the 24-hour expiration.
    - Deleting the last list creates the default list (see 6.2.5) so the user never sees zero lists within an active session.
  - **Priority:** Medium
- [ ] Section 6.2.5 Expectation-setting empty state: write the capability description from `intent.md` (capability 9), with:
  - **Rules:**
    - A new session (no lists for this session) opens on one list named "My First List", already created and active.
    - The item input is focused and shows a placeholder hint inviting the user to add something.
    - A single-line note near the input explains the 24-hour lifetime in plain language ("Lists disappear 24 hours after you create them — keep it light.").
    - No tutorial, overlay, or onboarding flow is shown.
  - **Priority:** Medium

## Section 7 — Functional Requirements

- [ ] Section 7.1 List lifecycle: write the system-triggered behaviors that Section 6 structurally cannot hold:
  - **Scheduled list expiration**: 24 hours after a list's creation timestamp, the system deletes the list and all of its items. No notification is sent to the user; the visible-expiration capability (6.2.1) is the only signal.
  - **Active-session handling at expiration**: If a user is viewing or editing a list at the moment it expires, their next action on that list (toggling an item, editing, adding) is rejected and the UI returns the user to a fresh empty state for that list slot.
  - **Storage reclamation**: Expired list content is removed from operational storage and does not persist in any user-accessible form afterward.

## Section 8 — Non-Functional Requirements

- [ ] Section 8.1 Performance: write:
  - **Response Time**: Adding, completing, and deleting an item feel instant — no visible spinner or delay under normal connectivity.
  - **Capacity**: A single session can hold at least a few hundred items per list and dozens of concurrent lists without user-visible slowdown.
  - **Growth**: The product is designed to be cheap to operate at any scale because all data ages out within 24 hours; storage cost is bounded by traffic, not by history.
  - **Availability**: Best-effort for a free demo; no formal uptime commitment.
- [ ] Section 8.2 Security: write:
  - **Identity**: The app does not authenticate users. A per-session identifier scopes which lists belong to the current browser session.
  - **Access Control**: A user only ever sees lists associated with their own session identifier.
  - **Data Protection**: No personally identifiable information is collected or stored. List and item text is stored as the user typed it; the operator can technically read it. Users are warned in the empty state not to store sensitive content (see Section 10 risks).
  - **Audit**: No identity, no per-user audit trail. Aggregate operational logs (rate limit events, error rates) are retained for operating the service.
- [ ] Section 8.3 Usability: write:
  - **Accessibility**: Meets WCAG 2.1 AA — every interactive element is reachable and operable from the keyboard, and screen readers can navigate lists and items.
  - **Device Support**: Usable on phones, tablets, and desktops. Tap targets meet platform minimums.
  - **Browser Support**: Latest two versions of Chrome, Firefox, Safari, and Edge.
  - **Languages**: English only for the demo.
- [ ] Section 8.4 Data Management: write:
  - **Durability**: User data survives normal app outages while it remains within its 24-hour lifetime; it does not survive the end of that lifetime, by design.
  - **Retention**: Hard ceiling of 24 hours from list creation. No archive, no soft-delete, no recovery.
  - **Portability**: No export mechanism in v1 — the product is for short-sitting use; users wanting to keep their data should copy it elsewhere before expiration.

## Section 9 — Rollout Phases

- [ ] Section 9 Rollout Phases: replace the multi-phase template content with a single paragraph: "Single release. All capabilities in Section 6 and the lifecycle behaviors in Section 7 ship together; no phasing for the demo."

## Section 10 — Risk Assessment and Mitigation

- [ ] Section 10.1 Technical Risks: write:
  - **Storage growth from abuse**: An anonymous, world-wide writeable surface attracts bots and spam, which could inflate storage and traffic costs — **Mitigated by** per-IP rate limits on list and item creation and by the 24-hour wipe (no abuse data persists past a day).
  - **Active-session disruption at expiration**: A list expiring while the user is mid-edit produces a jarring failure — **Mitigated by** the visible-expiration capability (6.2.1) and a graceful return-to-empty-state behavior (7.1).
- [ ] Section 10.2 User Adoption Risks: write:
  - **Data-loss surprise**: A user invests effort in a list, doesn't expect the 24-hour wipe, returns to find it gone, and concludes the product is broken — **Mitigated by** visible expiration on every list (6.2.1) and an expectation-setting empty state (6.2.5).
  - **Misuse for sensitive data**: Anonymous + no-signup creates a false sense of privacy; a user pastes passwords or account numbers expecting protection — **Mitigated by** a plain-language note in the empty state; **residual risk** remains and is acknowledged. Encryption-at-rest of user content is not in v1 scope.
- [ ] Section 10.3 Business Risks: render as `N/A — demo project, no business KPIs at risk.`
- [ ] Section 10.4 External Risks: render as `N/A — no external dependencies in v1 (no third-party integrations, no vendor lock-in).`
- [ ] Section 10.5 Risk Monitoring and Response: write:
  - **Risk Review Frequency**: One-shot review at release; no ongoing review process for the demo.
  - **Escalation Process**: N/A — single-maintainer demo project.
  - **Contingency Planning**: If abuse overwhelms rate limits, the operator can disable creation globally until mitigations are tightened.

## Section 11 — Success Measurement

- [ ] Section 11.1 Quantitative Metrics: write:
  - **Engagement**:
    - Add-to-first-item time — target: ≥50% of new sessions add at least one item within 60s of arrival, measured server-side.
    - Items per session — target: median ≥3 items across ≥1 list, measured server-side.
  - **System Performance**:
    - Median response time for item creation — target: <200ms server-side, measured per request.
    - Rate-limit-triggered request share — target: <1% of requests under normal load, measured server-side.
- [ ] Section 11.2 Qualitative Assessment: write:
  - **First-impression check**: Manual walk-through by a fresh user; pass criterion is that they understand the 24-hour lifetime without being told verbally.
- [ ] Section 11.3 Success Thresholds: write:
  - **Minimum Viable Success**: The add-to-first-item time metric exceeds 30%; no critical defects.
  - **Target Success**: Add-to-first-item time exceeds 50% (the headline objective in 3.2).
  - **Exceptional Success**: Add-to-first-item time exceeds 70% and median items per session exceeds 5.
- [ ] Section 11.4 Measurement Tools and Dashboards: write:
  - **Analytics Tools**: Server-side request logs aggregated per session; no client-side analytics, no third-party trackers.
  - **Survey Tools**: None for the demo.
  - **Dashboard Creation**: A single operator-facing chart showing daily session counts and add-to-first-item rate.
  - **Data Access**: Operator only.

## Section 12 — Appendices

- [ ] Section 12.1 Glossary: render as `N/A — no shared glossary.md exists for this corpus.`
- [ ] Section 12.2 References: render as `Omit` (no external references; section not rendered).

## Document footer

- [ ] Document footer: write:
  - **Document Version**: 0.1 (demo)
  - **Last Updated**: 2026-06-27
  - **Document Owner**: demo project
  - **Stakeholders**: N/A — demo project
