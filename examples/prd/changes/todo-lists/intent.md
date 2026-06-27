# Intent — Anonymous TODO Lists (demo)

## Trigger

Demo project to exercise the PRD skill family. Built as a free, world-wide-accessible web app for short-lived task lists, with no sign-up and a deliberately short data lifetime.

## Problem

People often need a quick, throwaway place to capture a small set of TODOs for a single sitting — a packing list before a weekend trip, an agenda before a meeting, errands for the afternoon, brainstorm items at the start of a session. The dominant options force a bad trade:

- **Heavy task managers** (Todoist, Things, Asana) require an account, a download, or both — too much friction for a 30-minute need.
- **Pen and paper or a sticky note** works for a single list but doesn't scale to a couple of parallel ones, and is easy to lose.
- **Notes apps** accumulate stale items forever; users either let cruft pile up or spend energy gardening their list.

This product is deliberately the opposite shape: zero sign-up, zero install, and an explicit short lifetime so the user never has to clean up. The ephemerality is the feature, not a limitation.

## Target users

**The short-sitting list-keeper.** Someone with a TODO need that is bounded to roughly one sitting or one day — packing for a trip, prepping for a meeting, running weekend errands, organizing a brainstorm. They want to type a few things, check most of them off in the next few hours, and walk away. They do not want an account, a sync indicator, a settings page, or a permanent list that will be 80% stale next month.

Secondary: someone who already uses a heavy task manager for their long-lived work and wants a separate, lightweight surface for "today only" items that should never leak into their permanent system.

## Success metric

**≥50% of new sessions add at least one item within 60 seconds of arrival.** This number captures whether the no-friction promise actually pays off: if the empty state, the input, and the keyboard flow are tight enough, a visitor who came to use the tool should be in flow within a minute. Measured server-side from anonymous session creation; no per-user tracking required.

## Product capabilities

Each capability is described from the user's side — what they see, what they do, what changes for them. Priority is one of High / Medium / Low.

1. **Quick capture.** User types item text into a single input and presses Enter. The item appears in the active list immediately, the input clears, and focus stays in the input so the next item can be typed without reaching for the mouse. **Priority: High.**

2. **One-motion completion.** A checkbox or tap target next to each item toggles its done state. No confirmation dialog. Toggling back un-completes the item. **Priority: High.**

3. **Multiple named lists.** User can have several lists at once (e.g., "Groceries", "Meeting", "Errands"). A sidebar (or equivalent persistent navigation) shows all lists and which one is active. Switching lists is one click. **Priority: High.**

4. **Ephemeral session storage.** Lists and items exist only on the product's servers — nothing is written to the user's device beyond what the browser needs for the active tab. As long as the browser session stays alive and the list is younger than its lifetime (see capability 5), the user can keep working with their lists. Opening the app in a different browser or device is a fresh start. **Priority: High.**

5. **Visible expiration.** Every list shows how long it has until it disappears (e.g., "expires in 18h"). The 24-hour lifetime is a feature, not a gotcha — the user is told up front when a list will be wiped, on the list itself, so there is never a surprised loss. **Priority: High.**

6. **In-place editing.** User clicks (or taps) a list name or item text and edits it inline. Enter commits, Escape cancels. No separate "edit" screen. **Priority: Medium.**

7. **Hide completed items.** A toggle on each list collapses completed items out of view, leaving only open ones. Toggling again brings them back. Default state: completed items shown but visually de-emphasized (e.g., strikethrough + reduced opacity). **Priority: Medium.**

8. **Remove items and lists.** A delete affordance on each item removes it immediately, no confirmation. A delete affordance on each list shows a lightweight confirmation ("Delete 'Groceries' and its 12 items?") before removing the list and all its items. **Priority: Medium.**

9. **Expectation-setting empty state.** A first-time visitor sees a default list ("My First List") already created, the item input focused with an inviting placeholder, and a one-line note explaining the 24-hour lifetime. The user understands the ephemerality before typing anything. **Priority: Medium.**

## Boundaries — out of scope for v1

Explicitly considered and ruled out. Captured here so future work doesn't accidentally re-litigate them.

- **No persistent storage of any kind.** No way to extend a list past 24 hours; no export; no archive. If a user wants permanence, they should use a permanent tool.
- **No accounts, sign-in, or identity.** The app does not know who its users are.
- **No client-side storage of list data.** The user's device holds nothing beyond what the browser session naturally needs while the tab is open. (Implementation may use small, non-content session identifiers; user-visible content stays server-side.)
- **No sharing or shareable URLs.** Each session is private to the browser that created it.
- **No sync across devices, tabs, or browsers.** Opening the app anywhere new is a fresh start.
- **No due dates, reminders, drag-to-reorder, subtasks, tags, or search.** The product stays one level deep and one screen wide.

## Constraints

- **Reach.** Works in modern desktop and mobile browsers (latest two versions of Chrome, Firefox, Safari, Edge).
- **Anonymity.** No personally identifiable information is collected or stored. No analytics tied to identity.
- **Persistence model.** Lists are stored server-side and identified by an in-session token. The user's device retains nothing of substance beyond the active tab. Each list is automatically deleted 24 hours after it is created, regardless of activity.
- **Operator visibility.** Because list contents live on the product's servers, the operator can technically see them. Users are told not to store sensitive information (see Risks).

## Phases

Single release. All capabilities ship together; the scope is small enough that phasing would be overhead, not value.

## Risks

- **Data-loss surprise.** A user invests effort in a list, doesn't expect the 24-hour wipe, returns to find it gone, and concludes the product is broken. **Mitigated by** capability 5 (visible expiration on every list) and capability 9 (expectation-setting on first visit).
- **Misuse for sensitive data.** Anonymous + no-signup creates a false sense of privacy; a user might paste passwords, account numbers, or other sensitive content expecting the ephemerality to protect them. **Mitigated by** a plain-language note in the empty state ("Don't put anything secret in here — the operator can see what you type") and by the 24-hour wipe limiting exposure time. Not solved — this remains a real residual risk.
- **Spam and abuse.** An anonymous, free, world-wide writeable surface is attractive to bots and abuse. **Mitigated by** per-IP rate limits on list and item creation and by the 24-hour wipe (no abuse persists). Specifics deferred to engineering design — the PRD records that abuse mitigation exists, not how.
- **Operator cost.** Free, world-wide, anonymous storage with no signup gate could grow expensive. **Mitigated by** the bounded data lifetime (every list ages out in 24 hours, so steady-state storage is capped by traffic, not by accumulated history).

## Context

Demo project. No broader product strategy, no competitive landscape analysis, no organizational alignment — the artifact exists to exercise the PRD skill family, not to position a real product.
