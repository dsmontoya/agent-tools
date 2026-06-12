# Scenario: Internal Bug Tracker

## What you're building

You're the engineering lead (acting as PM) at an 8-person platform team inside a 200-person company. You want to write a PRD for an **internal bug tracker** to replace the spreadsheet you've been using.

## Why now

The team has grown from 3 to 8 in the last year. Bugs are getting lost. Tracking in a spreadsheet means context, history, and priority are all manual. You've evaluated three off-the-shelf options but each costs $30k+/year for the team size; building it would take ~6 sprints of one engineer.

## What you broadly know

- The team itself is the only user — 8 engineers + occasional PM/designer collaborators.
- Bugs come from internal QA, customer support tickets, and on-call rotations.
- You need to track priority, owner, status, related Slack thread, and a free-text description.
- Success will be measured by "no bugs lost" — bugs older than 90 days should be either closed or actively worked.

## What you don't know yet

- Whether to embed in your existing GitHub workflow or build as a standalone web app.
- How to handle the customer-support-ticket integration without rebuilding the support tool.
- Whether the engineering manager wants to extend this to feature requests too.

Stay in character as this PM throughout the session. Invent details consistent with the above when asked.
