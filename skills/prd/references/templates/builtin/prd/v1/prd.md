# Product Requirements Document: [Feature Name]

## Table of Contents

- [1. Context](#1-context)
  - [1.1 Background](#11-background)
  - [1.2 Strategic Rationale](#12-strategic-rationale)
- [2. Product Overview](#2-product-overview)
- [3. Goals and Objectives](#3-goals-and-objectives)
  - [3.1 Business Goals](#31-business-goals)
  - [3.2 Objectives and Key Results (OKR)](#32-objectives-and-key-results-okr)
- [4. Core Concepts and Terminology](#4-core-concepts-and-terminology)
- [5. Target Users](#5-target-users)
- [6. Product Capabilities](#6-product-capabilities)
- [7. Functional Requirements](#7-functional-requirements)
- [8. Non-Functional Requirements](#8-non-functional-requirements)
- [9. Rollout Phases](#9-rollout-phases)
- [10. Risk Assessment and Mitigation](#10-risk-assessment-and-mitigation)
- [11. Success Measurement](#11-success-measurement)
- [12. Appendices](#12-appendices)

---

## 1. Context

[Brief framing: why this matters and how it fits the broader product vision.]

### 1.1 Background

[Current state and what motivated this change. Keep it brief — the PRD documents *this* change, not the full product history. For broader context, reference earlier PRDs or external onboarding docs.]

### 1.2 Strategic Rationale

- **Why now**: [What makes this the right time — market shift, user signal, business need, technical enabler.]
- **Alignment**: [How this aligns with broader product strategy, roadmap, or in-flight work.]
- **Dependencies**: [Foundational work, prior features, or organizational prerequisites that must be in place before this can ship. Name the *capability* or *milestone* required, not how it's built.]

---

## 2. Product Overview

[Brief description of the feature. Answers three questions:]

- **What does it do?** — The core functionality and capabilities.
- **Who is it for?** — The intended users and their context.
- **What problem does it solve?** — The pain point or opportunity being addressed.

---

## 3. Goals and Objectives

[This section defines the strategic business goals and measurable objectives that define success for this feature.]

### 3.1 Business Goals

[Key business objectives this feature will achieve. Examples: improving user satisfaction, reducing operational costs, increasing market share, ensuring compliance, enabling new revenue streams. Include as many goals as the feature genuinely has — no fewer, no padding.]

- **[Goal]**: [Brief explanation of how this feature achieves this strategic business outcome.]

### 3.2 Objectives and Key Results (OKR)

[Objectives are specific, measurable outcomes that directly support the business goals. While business goals are strategic and qualitative, objectives are tactical and quantitative. They answer "What specific results do we want to achieve?" and should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Each objective should have associated Key Results — the specific metrics you'll track to measure progress. Key Results should include both leading indicators (predictive) and lagging indicators (results), with a baseline, target, and measurement frequency.]

1. **[Objective 1]**: [Specific measurable outcome with timeline and how it supports business goals]
   - **Key Result**: [Metric name] (target: [specific target], baseline: [current state], frequency: [how often measured])
   - **Key Result**: [Metric name] (target: [specific target], baseline: [current state], frequency: [how often measured])

2. **[Objective 2]**: [Specific measurable outcome with timeline and how it supports business goals]
   - **Key Result**: [Metric name] (target: [specific target], baseline: [current state], frequency: [how often measured])
   - **Key Result**: [Metric name] (target: [specific target], baseline: [current state], frequency: [how often measured])

3. **[Objective 3]**: [Specific measurable outcome with timeline and how it supports business goals]
   - **Key Result**: [Metric name] (target: [specific target], baseline: [current state], frequency: [how often measured])
   - **Key Result**: [Metric name] (target: [specific target], baseline: [current state], frequency: [how often measured])

---

## 4 Core Concepts and Terminology

[This section defines the domain-specific language and key concepts that are essential to understanding the feature. It serves as a shared vocabulary for all stakeholders and ensures everyone has the same understanding of important terms.]

### 4.1 [Key Concept 1]

[Define the primary concept/entity this feature deals with. This is typically the main "thing" your feature creates, manages, or manipulates. Include its key attributes, relationships, and lifecycle.]

- **[Sub-concept A]**: [Definition, purpose, and how it relates to the main concept]
- **[Sub-concept B]**: [Definition, purpose, and how it relates to the main concept]
- **[Sub-concept C]**: [Definition, purpose, and how it relates to the main concept]

### 4.2 [Key Concept 2 - States/Statuses]

[Define the different states or statuses that your main entity can have throughout its lifecycle. This helps clarify the workflow and business rules. Include what triggers state changes and what actions are available in each state.]

- **[State/Status 1]**: [Definition, when this state occurs, what actions are allowed, and exit conditions]
- **[State/Status 2]**: [Definition, when this state occurs, what actions are allowed, and exit conditions]
- **[State/Status 3]**: [Definition, when this state occurs, what actions are allowed, and exit conditions]

### 4.3 [Key Workflow/Process]

[Define the main business process or workflow that this feature enables or automates. This should show the sequence of steps, decision points, and how different users interact with the system. Include both happy path and alternative flows.]

- **[Process Step 1]**: [Description of this step, who performs it, inputs/outputs, and decision points]
- **[Process Step 2]**: [Description of this step, who performs it, inputs/outputs, and decision points]
- **[Process Step 3]**: [Description of this step, who performs it, inputs/outputs, and decision points]

### 4.4 [Additional Concepts - Optional]

[Add additional concept sections as needed for complex features. Examples might include:]

- [Permission/Role concepts]
- [Integration concepts]
- [Data relationship concepts]
- [Business rule concepts]

---

## 5. Target Users

[Identify the personas who will interact with this feature. Personas defined in the shared `personas.md` at the PRD directory root should be referenced rather than redefined. PRD-specific personas (one-off user types unique to this feature) can be defined inline in 5.2.]

### 5.1 Personas

- **[Persona name]** — see [personas.md](./personas.md#persona-name).
- **[Persona name]** — see [personas.md](./personas.md#persona-name).

### 5.2 PRD-specific personas (optional)

[For one-off personas that don't merit a shared definition. Most PRDs won't need this — if you find yourself frequently adding personas here, promote them to `personas.md`.]

- **[User Type]**: [Brief description — role, responsibilities, and how they'll use the feature.]

### 5.3 User Research Insights (optional)

[Key findings from user research that inform this feature's design and priority — qualitative feedback, usability testing results, behavioral data. Skip this subsection if no research has been conducted.]

---

## 6. Product Capabilities

[Describes what the product does, organized by user journey. **Strictly UX-language** — what the user sees, does, gets, can't do. A non-engineer should be able to read this section and understand it.

Each capability includes design rationale, expected experience, business rules, and — where the interaction of multiple conditions produces non-obvious behavior — specific edge-case scenarios.

Organize by user journey (e.g., Onboarding, Core Workflow, Administrative Tasks). Each capability should describe a cohesive piece of functionality from the user's perspective. For system-level technical contracts (APIs, data models, integrations), use Section 7 Functional Requirements instead.]

### 6.1 [Capability Area 1]

#### 6.1.1 [Specific Capability]

[Describe the user experience, including the flow, key interactions, and design decisions. Explain *why* the design works this way.]

**Rules:**

- [Rule 1]: [Declarative statement of what the system must do or enforce]
- [Rule 2]: [Declarative statement of what the system must do or enforce]

**Priority**: [High/Medium/Low]

#### 6.1.2 [Another Capability]

[Description of the capability...]

**Rules:**

- [Rule 1]: [Declarative statement]
- [Rule 2]: [Declarative statement]

**Priority**: [High/Medium/Low]

### 6.2 [Capability Area 2]

[Another set of related capabilities...]

---

## 7. Functional Requirements (optional)

[Captures system behaviors that don't fit Section 6's user-journey shape — scheduled jobs, background reconciliation, audit logging, system-emitted events, system-to-system notifications, recurring cleanups. Things the system does where there is no user in the room.

**Stay product-level.** Describe *what* the system does as observable behavior — no code, schemas, endpoints, table names, or specific tech. Implementation details belong in engineering design documents.

**Do not restate Section 6 Rules here.** Rules belong inline with the capability they govern. This section is only for behaviors Section 6 structurally cannot hold.

**Skip this section** when the feature is purely user-facing. Most PRDs without background or system-triggered behaviors won't need it.]

### 7.1 [Behavior Area 1]

- **[Behavior 1]**: [What the system does, when it does it, and what it produces — in observable terms]
- **[Behavior 2]**: [What the system does, when it does it, and what it produces — in observable terms]

### 7.2 [Behavior Area 2]

- **[Behavior 1]**: [What the system does, when it does it, and what it produces — in observable terms]
- **[Behavior 2]**: [What the system does, when it does it, and what it produces — in observable terms]

---

## 8. Non-Functional Requirements

[Non-functional requirements describe how the system should behave — the quality attributes and constraints. These are often called "ilities" (scalability, usability, reliability, etc.) and are critical for user satisfaction and system success.]

### 8.1 Performance

- **Response Time**: [How fast operations should feel to the user, e.g., "Page loads within 2 seconds", "Search results in under 500ms"]
- **Capacity**: [Expected load the system should handle, e.g., "Support 1,000 concurrent users", "Handle 10,000 transactions per hour"]
- **Growth**: [How the system should accommodate growth, e.g., "Handle 10x current load without user-visible degradation"]
- **Availability**: [Uptime expectations and acceptable maintenance windows, e.g., "99.9% uptime", "Planned maintenance windows no longer than 4 hours per month"]

### 8.2 Security

- **Identity**: [How users prove who they are, e.g., "Users sign in with their existing identity provider", "Step-up verification required for sensitive actions"]
- **Access Control**: [Who can see or do what, e.g., "Administrators can manage other users; standard users cannot", "Users only see their own data"]
- **Data Protection**: [Expectations for sensitive data, e.g., "Personal data is not visible to other users", "Payment details are never shown in full after entry", "Complies with GDPR for EU users"]
- **Audit**: [What activity must be reviewable after the fact, e.g., "Every sign-in attempt is recorded", "Every data export is attributable to a user"]

### 8.3 Usability

- **Accessibility**: [Standards the experience must meet, e.g., "Meets WCAG 2.1 AA", "Fully usable with a screen reader", "Fully usable from the keyboard"]
- **Device Support**: [Devices and form factors that must work, e.g., "Usable on phones and tablets", "Touch-friendly targets throughout"]
- **Browser Support**: [Which browsers must work, e.g., "Latest two versions of Chrome, Firefox, Safari, and Edge"]
- **Languages**: [Languages and regional formats supported, e.g., "Available in English and Spanish", "Dates and currencies shown in the user's locale"]

### 8.4 Data Management

- **Durability**: [How resilient user data must be, e.g., "User data is never lost in the event of a single-region outage", "Users can recover deleted items within 30 days"]
- **Retention**: [How long data is kept, e.g., "User data retained for 7 years after account closure", "Activity logs retained for 90 days"]
- **Portability**: [How users get their data out, e.g., "Users can export all their data in a machine-readable format on demand"]

---

## 9. Rollout Phases

[Break the release into phases that each deliver standalone value to users. Each phase should be something the team can ship and learn from. Consider dependencies, risk mitigation, and early user feedback opportunities.]

### 9.1 Phase 1: [Phase Name] ([Months X-Y])

**Objective**: [Clear, specific objective for this phase that delivers standalone value]

**Features**:

- [Feature 1 - brief description of scope and value]
- [Feature 2 - brief description of scope and value]
- [Feature 3 - brief description of scope and value]

**Success Criteria**:

- [Measurable success criterion 1 with specific target]
- [Measurable success criterion 2 with specific target]
- [Measurable success criterion 3 with specific target]

**Key Milestones**:

- [Milestone 1]: [Date] - [Deliverable]
- [Milestone 2]: [Date] - [Deliverable]
- [Milestone 3]: [Date] - [Deliverable]

**Dependencies**:

- [Dependency 1]: [Description and impact]
- [Dependency 2]: [Description and impact]

**Post-Phase Activities**:

- [Activity 1]: [Description and timeline]
- [Activity 2]: [Description and timeline]

### 9.2 Phase 2: [Phase Name] ([Months X-Y])

[Repeat structure for subsequent phases...]

---

## 10. Risk Assessment and Mitigation

[Identify potential risks that could impact project success and define specific mitigation strategies. Consider technical, user adoption, business, and external risks. Regular risk assessment should continue throughout development.]

### 10.1 Technical Risks

[Risks related to technology, architecture, performance, integration, and development challenges.]

- **[Risk 1]**: [Detailed description of the risk and its potential impact] — **Mitigated by** [specific mitigation strategy, timeline, and responsible party]
- **[Risk 2]**: [Detailed description of the risk and its potential impact] — **Mitigated by** [specific mitigation strategy, timeline, and responsible party]

[**Example Technical Risks:**

- The system slows down noticeably as usage grows
- A third-party service we depend on becomes unavailable or rate-limits us
- Existing users experience downtime or data loss during the transition
- Users on older browsers or devices can't access the feature
- Sensitive user data is exposed to people who shouldn't see it]

### 10.2 User Adoption Risks

[Risks related to user acceptance, change management, training, and behavioral change.]

- **[Risk 1]**: [Detailed description of the risk and its potential impact] — **Mitigated by** [specific mitigation strategy, timeline, and responsible party]
- **[Risk 2]**: [Detailed description of the risk and its potential impact] — **Mitigated by** [specific mitigation strategy, timeline, and responsible party]

[**Example User Adoption Risks:**

- Resistance to workflow changes
- Insufficient user training and support
- Complex user interface reducing adoption
- Missing key features users expect
- Poor mobile experience]

### 10.3 Business Risks

[Risks related to business objectives, market conditions, resource availability, and strategic alignment.]

- **[Risk 1]**: [Detailed description of the risk and its potential impact] — **Mitigated by** [specific mitigation strategy, timeline, and responsible party]
- **[Risk 2]**: [Detailed description of the risk and its potential impact] — **Mitigated by** [specific mitigation strategy, timeline, and responsible party]

[**Example Business Risks:**

- Budget overruns or resource constraints
- Changing business priorities
- Competitive pressure or market changes
- Regulatory or compliance requirements
- Key stakeholder availability]

### 10.4 External Risks

[Risks related to external dependencies, vendors, market conditions, and factors outside direct control.]

- **[Risk 1]**: [Detailed description and impact] — **Mitigated by** [mitigation strategy]
- **[Risk 2]**: [Detailed description and impact] — **Mitigated by** [mitigation strategy]

### 10.5 Risk Monitoring and Response

- **Risk Review Frequency**: [How often risks will be reassessed]
- **Escalation Process**: [When and how to escalate risks]
- **Contingency Planning**: [Backup plans for high-impact risks]

---

## 11. Success Measurement

[Define how you will measure and evaluate the success of this feature both during development and after launch. Include both quantitative metrics and qualitative assessment methods.]

### 11.1 Quantitative Metrics

[Specific, measurable data points that will be tracked to assess feature success. Organize by category and include measurement methods.]

**[Metric Category 1 - e.g., User Engagement]**:

- [Specific metric with target and measurement method]
- [Specific metric with target and measurement method]
- [Specific metric with target and measurement method]

**[Metric Category 2 - e.g., Business Impact]**:

- [Specific metric with target and measurement method]
- [Specific metric with target and measurement method]
- [Specific metric with target and measurement method]

**[Metric Category 3 - e.g., System Performance]**:

- [Specific metric with target and measurement method]
- [Specific metric with target and measurement method]

### 11.2 Qualitative Assessment

[Methods for gathering subjective feedback and assessing user satisfaction, content quality, and strategic value.]

- **[Assessment Type 1 - e.g., User Satisfaction]**: [Description of assessment method, frequency, sample size, and analysis approach]
- **[Assessment Type 2 - e.g., Content Quality]**: [Description of assessment method, frequency, sample size, and analysis approach]
- **[Assessment Type 3 - e.g., Workflow Efficiency]**: [Description of assessment method, frequency, sample size, and analysis approach]
- **[Assessment Type 4 - e.g., Strategic Alignment]**: [Description of assessment method, frequency, sample size, and analysis approach]

### 11.3 Success Thresholds

[Define specific thresholds that indicate different levels of success.]

- **Minimum Viable Success**: [Baseline metrics that indicate the feature is working]
- **Target Success**: [Metrics that indicate the feature is meeting expectations]
- **Exceptional Success**: [Metrics that indicate the feature is exceeding expectations]

### 11.4 Measurement Tools and Dashboards

[Specify the tools and systems that will be used to collect and visualize measurement data].

- **Analytics Tools**: [Tools for tracking user behavior and system performance]
- **Survey Tools**: [Tools for collecting user feedback]
- **Dashboard Creation**: [How data will be visualized and reported]
- **Data Access**: [Who has access to measurement data and how often it's reviewed]

---

## 12. Appendices

### 12.1 Glossary

[See Glossary](./glossary.md) for definitions of key terms.]

### 12.2 References

[List relevant references, standards, or external documents]

- [Reference 1]
- [Reference 2]
- [Reference 3]

---

**Document Version**: [Version Number]
**Last Updated**: [Date]
**Document Owner**: [Team/Person Responsible]
**Stakeholders**: [List of key stakeholders]
