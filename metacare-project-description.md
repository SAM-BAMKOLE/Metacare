# Metacare

## Project Description and Product Overview

**Project category:** Digital Health / Care Coordination\
**Challenge:** Closing the Screening-to-Care Loop\
**Product type:** Multi-organization healthcare workflow and referral
coordination platform\
**Initial target users:** Clinics, screening providers, receiving
healthcare facilities, care coordinators and patients\
**Status:** Hackathon prototype specification

------------------------------------------------------------------------

## 1. Executive Summary

Metacare is a digital care-coordination platform designed to help
healthcare providers ensure that actionable screening results lead to
timely communication, appropriate clinical follow-up, completed
referrals and documented closure.

Healthcare screening programmes can identify people who may need further
assessment, but identifying a concern is only the beginning of the care
process. Results may be communicated late, referrals may be lost between
facilities, patients may not understand or complete the next step, and
healthcare teams may lack visibility into who is responsible for
following up. These gaps can leave patients without the appropriate next
action even when a screening programme has successfully identified a
potential health concern.

Metacare addresses this operational gap by connecting the stages of the
screening-to-care journey in one traceable workflow. It gives each
actionable result a recorded next step, a responsible owner, a
destination where appropriate, a due date and a visible status. It
enables authorized staff to monitor progress, communicate with patients
and receiving providers, identify stalled or overdue cases, and document
the outcome.

Metacare is not a diagnostic system and does not independently determine
whether a person has a disease or what treatment they should receive.
Clinical professionals remain responsible for interpreting results,
determining whether follow-up is required, setting clinical priorities
and making care decisions. Metacare supports the administrative and
coordination processes needed to make those decisions actionable.

The initial prototype will focus on a practical scenario in which a
community clinic records a screening result that requires further
assessment, creates a referral to another provider, tracks communication
and acknowledgement, and follows the case until an outcome or documented
exception is recorded.

## 2. The Problem

Screening programmes are valuable because they can identify potential
health concerns before a person seeks care independently or before a
condition becomes more difficult to manage. However, a screening result
does not automatically translate into completed care.

The transition from screening to follow-up can involve several people,
organizations, communication channels and separate record systems. A
patient may be screened at one facility, contacted by another team,
referred to a specialist or another facility, and expected to attend an
appointment elsewhere. Each handoff introduces the possibility of delay,
misunderstanding or lost information.

Common operational gaps include:

-   **Unclear ownership:** It may not be clear which staff member or
    facility is responsible for the next action.
-   **Delayed communication:** Patients or receiving providers may not
    be informed promptly that follow-up is required.
-   **Unacknowledged referrals:** The referring facility may not know
    whether the receiving provider received or accepted a referral.
-   **Incomplete follow-up:** Patients may not attend appointments, may
    be unreachable, or may not understand the instructions they receive.
-   **Fragmented records:** Screening results, referral details,
    appointment updates and follow-up notes may be spread across paper
    records, spreadsheets, messaging applications and separate systems.
-   **Limited visibility:** Managers and care coordinators may not have
    a reliable view of outstanding cases, overdue actions or referral
    completion.
-   **Weak closure processes:** A case may be marked as complete without
    a clear record of what happened, or may remain open indefinitely
    without an assigned person responsible for resolving it.

These are workflow and continuity-of-care problems. Metacare aims to
make the journey visible, assign responsibility and provide a record of
each important handoff.

## 3. Proposed Solution

Metacare provides a shared workflow for managing actionable screening
results and the follow-up activities that arise from them.

When an authorized healthcare worker records a screening event, they can
document the result and indicate whether a clinician has determined that
follow-up is required. If follow-up is required, the user can create a
case and referral, assign responsibility, select a receiving provider,
set an appropriate due date and record the next action.

The platform then provides a traceable case timeline. Authorized users
can record when a patient was contacted, when a referral was sent,
whether the receiving provider acknowledged it, whether an appointment
or further assessment took place, and what outcome or next step was
documented.

Metacare highlights cases that are unassigned, waiting for
acknowledgement, approaching a due date, overdue or blocked. It provides
work queues for the staff responsible for these cases and an operational
dashboard for authorized managers.

The core principle is:

> Every actionable screening result should have a visible next step, a
> responsible owner, a traceable handoff and a documented outcome or
> exception.

## 4. Product Goals

Metacare is intended to:

1.  Make actionable screening results visible and traceable from initial
    recording through follow-up.
2.  Establish clear ownership for each outstanding action.
3.  Reduce the likelihood that referrals are lost or forgotten between
    providers.
4.  Improve communication visibility between referring facilities,
    receiving providers and patients.
5.  Identify stalled, unacknowledged and overdue cases so that
    authorized staff can intervene.
6.  Maintain a chronological record of important care-coordination
    events.
7.  Give healthcare teams operational insight into referral progress and
    completion.
8.  Support responsible handling of sensitive information through
    appropriate access controls, data minimization and auditability.

## 5. Target Users and Roles

Metacare is designed for multiple user types. Access should be granted
according to each user's organization, responsibilities and permissions.

### 5.1 Organization Administrator

An organization administrator manages the organization's workspace and
operational configuration.

Typical responsibilities:

-   Manage organization details.
-   Invite, deactivate and manage organization members.
-   Assign roles and permissions.
-   Configure available departments or service units.
-   View organization-level operational metrics.
-   Review audit activity where authorized.

An administrator should not automatically receive unrestricted access to
every clinical detail merely because they administer the organization.
Administrative permissions and access to patient information should be
treated separately.

### 5.2 Screening Staff

Screening staff record screening events and the information needed to
initiate appropriate follow-up.

Typical responsibilities:

-   Register or locate a patient.
-   Record a screening event.
-   Enter the relevant result and supporting administrative details.
-   Record whether a qualified clinician has determined that follow-up
    is required.
-   Create or initiate a follow-up case where permitted.
-   Review the status of cases they are authorized to access.

Screening staff should not be given authority to make clinical
interpretations beyond their professional scope.

### 5.3 Clinician

Clinicians review relevant screening information and determine the
appropriate clinical next step within their professional scope.

Typical responsibilities:

-   Review screening information.
-   Document a clinical decision or recommendation.
-   Determine whether further assessment or referral is required.
-   Set or confirm clinical priority and follow-up instructions.
-   Review information returned by a receiving provider.
-   Document an appropriate clinical outcome or further plan.

The application should distinguish a recorded screening result from a
clinician-confirmed decision about what should happen next.

### 5.4 Care Coordinator

Care coordinators manage the operational progress of cases and help
patients complete the next steps in their care journey.

Typical responsibilities:

-   Review assigned cases.
-   Contact patients using approved channels.
-   Coordinate referrals and appointments.
-   Follow up on unacknowledged referrals.
-   Record communication attempts and responses.
-   Escalate overdue or blocked cases to the appropriate person.
-   Document administrative outcomes and unresolved exceptions.

### 5.5 Receiving Provider or Facility Staff

Receiving provider staff handle referrals sent to their organization.

Typical responsibilities:

-   View referrals addressed to their facility.
-   Acknowledge receipt.
-   Accept, decline or request additional information where appropriate.
-   Record appointment or assessment updates.
-   Return relevant follow-up information to the referring provider
    through an authorized process.

### 5.6 Patient

Patients should have a simple, accessible way to receive information
about the next steps in their care.

Depending on the prototype scope and consent model, patient-facing
capabilities may include:

-   View a notification that follow-up is required.
-   View approved referral instructions.
-   See appointment or contact information.
-   Confirm that they have received instructions.
-   Request assistance or indicate that they cannot attend.
-   View limited status updates that are appropriate to share.

The patient interface should not expose internal staff notes, unrelated
patient information or unreviewed clinical interpretations.

## 6. Core Product Modules

### 6.1 Authentication and Organization Management

Metacare supports authenticated users working within healthcare
organizations.

Key capabilities:

-   Secure sign-in and sign-out.
-   Organization membership.
-   Role-based access control.
-   Invitation and member-management workflows.
-   Session management.
-   Organization-scoped data access.

A user may belong to one or more organizations in the broader product
design, but the initial prototype can simplify this to a single active
organization per user session if necessary.

### 6.2 Patient Records

The patient module maintains the minimum information required to
coordinate care.

Potential fields include:

-   Internal patient identifier.
-   Name or display name.
-   Date of birth or age where necessary.
-   Approved contact details.
-   Relevant administrative notes.
-   Organization association.
-   Record creation and update timestamps.

The prototype should use fictional patient data. It should avoid
collecting sensitive information that is not necessary to demonstrate
the workflow.

Patient records should provide links to relevant screening events,
referrals and care-coordination history, subject to authorization.

### 6.3 Screening Management

The screening module records screening events and their operational
status.

A screening record may include:

-   Patient reference.
-   Screening type.
-   Date and location of screening.
-   Recording staff member.
-   Result category or structured result.
-   Relevant notes or attached administrative information.
-   Whether the result requires clinical review.
-   Whether an authorized clinician has confirmed that follow-up is
    required.
-   Next-step recommendation recorded by the responsible professional.
-   Creation and update timestamps.

The platform must not infer a diagnosis from a screening result. The
prototype may use fictional screening categories and sample workflows,
but clinical meaning and follow-up decisions must be represented as
decisions made by authorized professionals.

### 6.4 Referral Management

Referral management is the central module of Metacare.

A referral connects an actionable screening result or other documented
care need to a responsible person and, where applicable, a receiving
provider.

A referral should capture:

-   Referral identifier.
-   Patient reference.
-   Source screening event or documented reason.
-   Referring organization.
-   Receiving organization or provider.
-   Assigned owner.
-   Priority as determined by an authorized clinician.
-   Date created.
-   Due date or expected follow-up date.
-   Referral status.
-   Patient communication status.
-   Provider acknowledgement status.
-   Relevant instructions and approved supporting information.
-   Closure outcome or documented exception.

The system should prevent a referral from being treated as successfully
completed merely because it was created or sent.

### 6.5 Care Timeline and Activity History

Each case should have a chronological timeline of important events.

Example events:

-   Screening event recorded.
-   Result submitted for clinical review.
-   Clinician decision documented.
-   Follow-up case created.
-   Referral assigned.
-   Patient contact attempted.
-   Patient informed.
-   Referral sent.
-   Receiving provider acknowledged referral.
-   Appointment scheduled.
-   Appointment attended or missed.
-   Follow-up information received.
-   Further action assigned.
-   Case closed or exception documented.

Timeline entries should record the actor, timestamp, event type and
relevant details. Sensitive information should only be visible to users
with appropriate permissions.

### 6.6 Notifications and Reminders

The notification module helps users act on outstanding work.

Potential notifications include:

-   A new referral has been assigned.
-   A referral is awaiting acknowledgement.
-   A case is approaching its due date.
-   A case has become overdue.
-   A patient has responded to a communication.
-   A receiving provider has updated a referral.
-   A case has been escalated.

For the hackathon prototype, an in-app notification centre and simulated
SMS or messaging delivery are sufficient. The application should clearly
distinguish simulated messages from messages actually delivered through
an external provider.

Notification delivery should be designed to tolerate retries and
failures. A failed notification must not silently cause the underlying
care-coordination task to disappear.

### 6.7 Escalation and Outstanding Work Queues

Metacare should provide clear queues for work that needs attention.

Useful queue categories include:

-   Unassigned cases.
-   Referrals awaiting transmission.
-   Referrals awaiting acknowledgement.
-   Patients awaiting contact.
-   Cases approaching their due date.
-   Overdue cases.
-   Cases blocked by missing information.
-   Cases awaiting documentation from a receiving provider.
-   Cases requiring review before closure.

Escalation rules should be configurable and should direct work to an
appropriate human owner. The system should not make autonomous clinical
decisions based only on elapsed time.

### 6.8 Analytics and Operations Dashboard

The dashboard provides authorized users with a summary of
care-coordination activity.

Potential metrics:

-   Total screening events recorded.
-   Number of results requiring follow-up.
-   Open referrals.
-   Unassigned cases.
-   Referrals awaiting acknowledgement.
-   Overdue cases.
-   Completed referrals.
-   Cases with documented exceptions.
-   Referral acknowledgement rate.
-   Follow-up completion rate.
-   Average time between workflow stages.

Metrics must have clearly defined denominators, time windows and status
rules. For example, the referral completion rate should specify whether
it is calculated over referrals created during a selected period or all
referrals currently in the system.

The prototype can use fictional seeded records to demonstrate these
metrics. All demo data and calculated results must be clearly identified
as simulated.

## 7. End-to-End Workflow

The primary Metacare workflow is the journey from an actionable
screening result to documented follow-up.

### Step 1: Screening is recorded

An authorized staff member locates or creates a patient record and
records a screening event.

The result is stored with its source, date, recording user and relevant
information.

### Step 2: Clinical review takes place where required

If the screening result requires professional interpretation, it is
assigned for clinical review.

An authorized clinician reviews the information and records whether
follow-up is required and what next step is appropriate.

Metacare records the decision; it does not make that decision itself.

### Step 3: A follow-up case is created

When follow-up is confirmed as necessary, a case or referral is created.

The case receives:

-   A responsible owner.
-   A receiving provider or destination where applicable.
-   A priority set by an authorized professional.
-   A due date or expected follow-up date.
-   Approved instructions.
-   A traceable initial status.

### Step 4: The patient is informed

An authorized staff member contacts the patient through an approved
communication channel.

The system records the communication attempt, outcome and relevant next
step.

A failed contact attempt remains visible and may require another attempt
or escalation according to the organization's process.

### Step 5: The referral is transmitted and acknowledged

The referral is sent to the receiving provider through the available
channel.

The receiving provider can acknowledge receipt, request additional
information or decline the referral with a documented reason.

In the initial prototype, this interaction may take place between two
simulated organizations within Metacare.

### Step 6: Follow-up is tracked

The responsible team monitors the referral.

They can record whether an appointment was scheduled, whether the
patient attended, whether further assessment occurred and whether
additional action is required.

Overdue or blocked cases appear in the appropriate work queue.

### Step 7: Outcome or exception is documented

A case is closed only when an authorized user records an appropriate
outcome under the organization's workflow.

Possible outcomes include:

-   Follow-up completed and documented.
-   Further care arranged.
-   Referral redirected.
-   Referral declined with an alternative plan documented.
-   Patient declined or could not proceed.
-   Patient could not be reached after the documented process.
-   Other approved exception.

Some outcomes may require a further action rather than closure. Metacare
should preserve that distinction.

### Step 8: The workflow remains auditable

The case timeline and audit history preserve the sequence of important
events, who performed them and when.

Authorized users can review the journey and identify where delays or
communication failures occurred.

## 8. Referral Lifecycle and State Management

The referral lifecycle should be explicit and enforced by application
logic rather than allowing arbitrary status changes.

A proposed initial lifecycle is:

1.  **Draft:** Referral information is being prepared.
2.  **Pending assignment:** The referral requires an owner.
3.  **Ready to send:** Required administrative information is available.
4.  **Sent:** The referral has been transmitted through the recorded
    channel.
5.  **Awaiting acknowledgement:** The receiving provider has not yet
    confirmed receipt.
6.  **Acknowledged:** The receiving provider has confirmed receipt.
7.  **In progress:** The receiving provider or care team is acting on
    the referral.
8.  **Awaiting patient action:** The patient needs to take a documented
    next step.
9.  **Awaiting follow-up documentation:** The next step may have
    occurred, but the relevant information has not yet been recorded.
10. **Completed:** The required follow-up has been documented and the
    case meets the organization's closure criteria.
11. **Declined or redirected:** The referral was not accepted or was
    redirected, with a reason and next action recorded.
12. **Cancelled:** The referral was cancelled through an authorized
    process, with a reason.

Not every state must be used in every case. The application should
define valid transitions and require appropriate permissions and
supporting information for important changes.

Overdue, blocked and escalated should preferably be represented as
workflow flags or calculated conditions rather than replacing the
underlying referral status. This preserves the distinction between what
happened and whether action is now required.

## 9. Key User Interfaces

The initial application should prioritize a clear, professional,
desktop-first healthcare operations experience while remaining usable on
tablets and mobile devices.

### 9.1 Public Landing Page

Purpose:

-   Explain the problem Metacare addresses.
-   Communicate the product's value.
-   Introduce the major capabilities.
-   Provide access to sign-in or the demo environment.

### 9.2 Authentication Screens

Purpose:

-   Securely authenticate users.
-   Support organization-aware access.
-   Provide clear session and account feedback.

### 9.3 Overview Dashboard

Purpose:

-   Give users an immediate understanding of outstanding work.
-   Show relevant metrics and recent activity.
-   Highlight overdue and unassigned cases.
-   Provide shortcuts to common actions.

### 9.4 Patient Directory

Purpose:

-   Search and browse authorized patient records.
-   View basic patient information.
-   Navigate to screening events and referrals.

### 9.5 Patient Detail Page

Purpose:

-   Present a patient's relevant care-coordination history.
-   Show screening events and associated referrals.
-   Display the authorized case timeline.
-   Provide access to approved contact and administrative information.

### 9.6 Screening Management

Purpose:

-   Record new screening events.
-   Review existing screening records.
-   Identify records awaiting clinical review.
-   Navigate from a screening record to a resulting follow-up case.

### 9.7 Referral Work Queue

Purpose:

-   Display referrals grouped or filtered by status, owner, destination
    and due date.
-   Make overdue and unacknowledged cases easy to identify.
-   Support assignment and operational updates.

### 9.8 Referral Detail Page

Purpose:

-   Show referral information and current status.
-   Display the timeline of events.
-   Show the assigned owner and receiving provider.
-   Record patient communication and provider acknowledgement.
-   Document follow-up and closure information.

### 9.9 Notifications Centre

Purpose:

-   Show actionable updates.
-   Allow users to navigate directly to relevant cases.
-   Distinguish read, unread, failed and pending delivery states where
    appropriate.

### 9.10 Analytics Page

Purpose:

-   Present referral and follow-up performance.
-   Highlight bottlenecks.
-   Allow filtering by date range, facility and other authorized
    dimensions.
-   Support operational review without exposing unnecessary patient
    details.

### 9.11 Organization and Member Settings

Purpose:

-   Manage organization details.
-   Invite and manage users.
-   Assign roles.
-   Configure basic operational settings.

## 10. Data Model Overview

The initial relational data model should include the following entities:

  -----------------------------------------------------------------------
  Entity                              Purpose
  ----------------------------------- -----------------------------------
  Organizations                       Healthcare facilities or
                                      participating organizations

  Users                               Authenticated application users

  Organization memberships            User membership, role and
                                      organization-specific permissions

  Patients                            Minimum patient information
                                      required for coordination

  Screening events                    Recorded screening activities and
                                      results

  Clinical reviews                    Authorized professional decisions
                                      and next-step recommendations

  Referrals                           Follow-up requests, ownership,
                                      destination, status and due dates

  Care events                         Chronological record of case
                                      activity

  Notifications                       In-app and external notification
                                      records

  Notification attempts               Delivery attempts, outcomes and
                                      retry information

  Audit logs                          Security-relevant and sensitive
                                      record of user actions
  -----------------------------------------------------------------------

Important relationships:

-   An organization has multiple members.
-   A user can have organization-specific permissions.
-   An organization can manage multiple patient records.
-   A patient can have multiple screening events.
-   A screening event can lead to a clinical review.
-   A screening event or documented care need can result in a referral.
-   A referral belongs to a patient and has a referring organization.
-   A referral may have a receiving organization and an assigned owner.
-   A referral has multiple care events.
-   A referral may generate multiple notifications and delivery
    attempts.
-   Sensitive changes should produce appropriate audit records.

The database should use stable identifiers, foreign-key constraints,
timestamps and appropriate indexes. Important state transitions should
be performed through validated server-side operations.

## 11. Technical Architecture

Metacare should initially be implemented as a modular monolith. The
product does not need microservices for the hackathon prototype.

### Recommended stack

  Layer              Technology
  ------------------ ---------------------------------------------------
  Web application    Next.js App Router
  Language           TypeScript
  Package manager    pnpm
  UI                 React, Tailwind CSS and shadcn/ui
  Icons              Lucide
  Database           PostgreSQL
  ORM                Drizzle ORM
  Authentication     Better Auth or an equivalent established solution
  Validation         Zod
  Charts             Recharts
  Testing            Vitest and Playwright
  Hosting            Vercel or another suitable application host
  Database hosting   Managed PostgreSQL provider

### Architectural principles

-   Use Server Components for server-rendered pages and initial data
    retrieval.
-   Use Client Components for interactive forms, filters, tables,
    dialogs and charts.
-   Keep sensitive data access and authorization on the server.
-   Centralize permission checks and enforce them on every protected
    operation.
-   Use explicit service functions for important business workflows.
-   Keep database access organized by domain.
-   Use validated state transitions for referrals and care events.
-   Record audit events for sensitive actions.
-   Use a database-backed notification queue or job mechanism for
    reliable processing.
-   Keep external communication providers behind clear integration
    interfaces.

### Suggested project organization

``` text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── modules/
│   ├── patients/
│   ├── screenings/
│   ├── clinical-reviews/
│   ├── referrals/
│   ├── care-events/
│   ├── notifications/
│   ├── organizations/
│   └── analytics/
│
├── server/
│   ├── auth/
│   ├── permissions/
│   ├── patients/
│   ├── screenings/
│   ├── referrals/
│   ├── notifications/
│   └── audit/
│
├── lib/
│   ├── db/
│   ├── validation/
│   ├── utils/
│   └── integrations/
│
└── types/
```

This is a logical starting point, not a requirement to create every
directory immediately. The architecture should evolve with the
implemented features.

## 12. Security, Privacy and Responsible Use

Metacare handles information that may be sensitive. Privacy and security
must be treated as core product requirements rather than features to add
after the prototype is complete.

### Access control

-   Enforce role-based permissions on the server.
-   Scope patient and referral access to the user's authorized
    organization and responsibilities.
-   Prevent users from accessing records by changing identifiers in URLs
    or API requests.
-   Separate organization administration from clinical-record access.
-   Apply least-privilege access.

### Data protection

-   Collect only information needed for the workflow.
-   Use HTTPS in deployed environments.
-   Protect secrets and credentials through environment variables and
    secure deployment configuration.
-   Use secure authentication and session-management practices.
-   Avoid placing sensitive patient information in URLs, logs or
    notification previews.
-   Define appropriate retention and deletion policies before handling
    real patient data.

### Auditability

Record appropriate events such as:

-   Patient record creation and modification.
-   Screening result creation and updates.
-   Clinical review decisions.
-   Referral assignment and status transitions.
-   Patient communication records.
-   Access to particularly sensitive information where appropriate.
-   Closure, cancellation and exception decisions.
-   Permission and membership changes.

Audit records should identify the actor, action, affected record and
timestamp. They should not unnecessarily duplicate sensitive clinical
content.

### Clinical safety

Metacare must:

-   Avoid diagnosing patients.
-   Avoid independently interpreting screening results.
-   Avoid generating treatment instructions.
-   Avoid autonomously closing clinically relevant cases.
-   Keep clinical decisions with qualified professionals.
-   Make the difference between simulated data and real patient
    information clear.
-   Provide human review for important workflow decisions.
-   Ensure that overdue alerts prompt appropriate human attention rather
    than replacing clinical triage.

### Regulatory considerations

Any real deployment must be reviewed against the laws and healthcare
requirements applicable to its operating jurisdictions. For a Nigerian
deployment, this includes assessing obligations under the Nigeria Data
Protection Act and relevant healthcare-sector requirements. A hackathon
prototype using fictional data is not evidence of regulatory compliance.

## 13. MVP Scope

The hackathon MVP should demonstrate one complete, believable
care-coordination journey rather than attempting to implement an entire
hospital information system.

### Essential features

1.  Authentication and basic organization membership.
2.  Role-based access for administrators, screening staff, clinicians
    and care coordinators.
3.  Fictional patient registration and directory.
4.  Screening event creation.
5.  Clinical review and recording of a follow-up decision.
6.  Referral creation and assignment.
7.  Referral status management with valid transitions.
8.  Patient communication records.
9.  Receiving-provider acknowledgement.
10. Case timeline.
11. Overdue and unassigned work queues.
12. In-app notifications.
13. Basic operational dashboard.
14. Audit history for important actions.
15. Seeded demonstration data.

### Features to defer

-   Full electronic health record functionality.
-   Automated interpretation of laboratory results.
-   AI-powered diagnosis or risk prediction.
-   Real hospital-system integrations.
-   Production SMS and WhatsApp delivery.
-   Insurance claims and billing.
-   Complex appointment scheduling.
-   Wearable-device integration.
-   Advanced population-health analytics.
-   Multi-country regulatory configuration.
-   Microservices and complex infrastructure.

These may be future extensions, but they are not necessary to prove the
central product idea.

## 14. Demonstration Scenario

The prototype should be demonstrated through a single fictional patient
journey.

**Scenario:** A patient attends a community clinic for a screening
service. The screening result requires further assessment according to a
clinician's documented decision.

1.  A screening staff member opens the patient record.
2.  They create a screening event and record the result.
3.  The event is assigned for clinical review.
4.  A clinician reviews the record and documents that follow-up is
    required.
5.  A care coordinator creates a referral to a receiving facility.
6.  The referral is assigned to a responsible staff member with a due
    date.
7.  The patient is marked as contacted, and the communication attempt is
    recorded.
8.  The receiving facility acknowledges the referral.
9.  The receiving provider records an appointment or assessment update.
10. The care coordinator records the returned follow-up information.
11. An authorized user documents the outcome and closes the case where
    closure criteria are met.
12. The dashboard reflects the updated referral status and the case
    timeline displays the complete sequence.

The demonstration should also show at least one exception:

-   A referral is not acknowledged before its expected deadline.
-   Metacare identifies it as overdue.
-   The responsible coordinator receives an alert.
-   The coordinator records an escalation or follow-up attempt.
-   The case remains traceable until an appropriate next step is
    documented.

This demonstrates that Metacare handles both successful workflows and
cases that do not proceed as expected.

## 15. Measuring Success

The prototype should use clearly defined metrics to demonstrate
operational performance.

Suggested measures:

-   **Referral acknowledgement rate:** Percentage of referrals sent
    during a defined period that have been acknowledged.
-   **Follow-up completion rate:** Percentage of eligible referrals with
    a documented completed outcome during the selected measurement
    period.
-   **Overdue referral rate:** Percentage of open referrals that have
    passed their due date.
-   **Unassigned case count:** Number of actionable cases without a
    responsible owner.
-   **Time to acknowledgement:** Time between referral transmission and
    receiving-provider acknowledgement.
-   **Time to documented outcome:** Time between the initial actionable
    referral event and a documented outcome.
-   **Communication coverage:** Percentage of applicable cases with a
    recorded patient communication outcome.

For the hackathon, these metrics can be calculated using fictional seed
data. Their purpose is to demonstrate how an organization could monitor
its workflow, not to claim real-world clinical impact.

## 16. Scalability and Future Development

After the initial prototype, Metacare could evolve into a
care-coordination platform supporting multiple healthcare organizations
and referral networks.

Potential future capabilities include:

### Provider interoperability

-   Integration with electronic medical record systems.
-   Standards-based healthcare data exchange where appropriate.
-   Structured referral transmission and response.
-   Secure external provider APIs.
-   Import and export of authorized records.

### Patient communication

-   Actual SMS and WhatsApp integrations.
-   Appointment reminders.
-   Patient acknowledgement and response workflows.
-   Accessible communication formats and localization.

### Workflow intelligence

-   Configurable follow-up deadlines.
-   Operational bottleneck analysis.
-   Better workload distribution.
-   Trend analysis across facilities.
-   Human-reviewed recommendations for process improvement.

### Advanced analytics

-   Facility-level referral performance.
-   Screening-to-follow-up conversion.
-   Comparison of workflow performance over time.
-   Identification of recurring administrative bottlenecks.

### Deployment opportunities

Potential users and customers include:

-   Primary healthcare centres.
-   Private hospitals and clinics.
-   Diagnostic and screening centres.
-   Specialist referral networks.
-   Public-health programmes.
-   Non-governmental organizations coordinating screening programmes.
-   Healthcare networks operating across multiple facilities.

A practical pilot could begin with one referring clinic and one
receiving facility, using a limited screening pathway and agreed
operational measures.

## 17. Value Proposition

Metacare helps healthcare organizations move from simply recording
screening results to actively managing what happens next.

For screening staff, it provides a structured way to record results and
initiate appropriate follow-up.

For clinicians, it provides visibility into relevant screening
information and a record of decisions.

For care coordinators, it creates an organized queue of outstanding
tasks, referrals and patient communication activities.

For receiving providers, it provides a clear way to acknowledge and
update referrals.

For administrators, it provides operational insight into delays,
outstanding work and documented outcomes.

For patients, it aims to make the next step in their care journey
clearer and easier to follow.

The product's value is not that it replaces healthcare professionals.
Its value is that it helps the people and organizations involved in a
patient's care coordinate their work more reliably.

## 18. Project Positioning

**Product name:** Metacare

**Challenge:** Closing the Screening-to-Care Loop

**Short description:**

Metacare is a healthcare care-coordination platform that helps providers
ensure actionable screening results lead to timely communication,
acknowledged referrals, appropriate follow-up and documented closure.
Through case ownership, workflow tracking, notifications and operational
analytics, Metacare makes gaps in the screening-to-care journey visible
and actionable.

**One-line positioning:**

> From screening result to documented care: Metacare keeps every next
> step visible, assigned and accountable.

**Core product principle:**

> No actionable result should be left without a next step, a responsible
> owner or a documented outcome.

------------------------------------------------------------------------

## 19. Important Assumptions and Limitations

The initial prototype assumes:

-   Participating organizations and users have been created in the
    system.
-   Screening results are entered by authorized staff.
-   Clinical decisions are made by qualified professionals.
-   Referral destinations are known or selected from configured provider
    records.
-   Users have access to the information required for their assigned
    responsibilities.
-   Demonstration patients and clinical scenarios are fictional.
-   External messaging and provider integrations may be simulated.

The prototype does not establish:

-   Clinical effectiveness.
-   Diagnostic accuracy.
-   Improved patient health outcomes.
-   Regulatory approval or compliance.
-   Production readiness for real patient records.
-   Interoperability with any specific hospital system.
-   Guaranteed delivery of external notifications.

These limitations should be communicated honestly in the hackathon
submission and demonstration.

## 20. Definition of a Successful Hackathon Prototype

Metacare will be considered successful as a hackathon prototype when an
evaluator can:

1.  Sign in as different authorized user roles.
2.  View a fictional patient record.
3.  Record a screening event.
4.  See the event move through the appropriate clinical-review workflow.
5.  Create and assign a follow-up referral.
6.  Record patient communication.
7.  Sign in as a receiving-provider user and acknowledge the referral.
8.  Update the referral with a follow-up event.
9.  See overdue or blocked work identified and surfaced to the
    responsible user.
10. Document an appropriate outcome or exception.
11. See the case timeline and operational dashboard update accordingly.
12. Understand the security, clinical-safety and data-governance
    limitations of the prototype.

The central demonstration must work end to end. A smaller, reliable
implementation of this journey is more valuable than a broad collection
of disconnected screens.
