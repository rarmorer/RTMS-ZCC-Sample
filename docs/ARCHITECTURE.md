# Zoom In-Meeting Consent & RTMS App Architecture

## Executive Summary

This document outlines the architecture for an enterprise Zoom in-meeting application that demonstrates consent-based access to Real-Time Meeting Streaming (RTMS) transcripts. The app ensures that RTMS transcript access only begins when all participants have provided explicit consent, pausing automatically when new participants join until they also consent.

**Key Features:**
- Unanimous consent requirement before RTMS activation
- Real-time participant tracking with automatic pause/resume
- Host mode (authenticated) with full dashboard controls
- Guest mode (anonymous) with simple consent UI
- State synchronization across all app instances

---

## 1. Requirements Analysis

### 1.1 Functional Requirements

#### FR-1: Pre-Meeting Consent Collection
- **Description:** When the meeting begins, all participants must see a consent prompt
- **Acceptance Criteria:**
  - Consent UI appears immediately when app opens
  - UI shows clear "Agree" and "Disagree" buttons
  - User can only click once (no duplicate consents)
  - Visual confirmation shown after user consents

#### FR-2: Unanimous Consent Tracking
- **Description:** Track consent status for every participant in real-time
- **Acceptance Criteria:**
  - System maintains consent status (pending/agreed/disagreed) per participant
  - Host can view consent status for all participants
  - Consent state persists during the meeting session
  - System detects when all participants have consented

#### FR-3: Automatic RTMS Start
- **Description:** Start RTMS automatically when all participants consent
- **Acceptance Criteria:**
  - RTMS starts without manual intervention when unanimous consent achieved
  - Host receives notification that RTMS has started
  - All participants can see RTMS is active

#### FR-4: Dynamic Consent on New Joins
- **Description:** Pause RTMS when new participant joins, resume after they consent
- **Acceptance Criteria:**
  - System detects new participant join in real-time
  - RTMS pauses immediately upon detection
  - New participant sees consent prompt
  - RTMS resumes after new participant consents
  - All participants notified of pause/resume

#### FR-5: Host Dashboard
- **Description:** Provide host with full visibility and control
- **Acceptance Criteria:**
  - Host logs in via Zoom OAuth
  - Dashboard shows real-time participant list
  - Dashboard shows consent status per participant
  - Dashboard shows RTMS status (running/paused/stopped)
  - Dashboard shows reason for pause (e.g., "Waiting for John Doe")

#### FR-6: Guest Mode
- **Description:** Allow anonymous participation with consent-only UI
- **Acceptance Criteria:**
  - No authentication required for guest mode
  - UI shows only: branding, consent prompt, consent status
  - Minimal UI focused on consent action
  - No access to participant list or RTMS controls

#### FR-7: Disagreement Handling
- **Description:** Handle participants who disagree to consent
- **Acceptance Criteria:**
  - RTMS remains stopped if any participant disagrees
  - Host is notified which participant(s) disagreed
  - Disagreement is permanent for the session

### 1.2 Non-Functional Requirements

#### NFR-1: Real-Time Performance
- Participant join detection: < 2 seconds
- RTMS pause response time: < 3 seconds
- Consent state synchronization: < 1 second

#### NFR-2: Reliability
- Handle network interruptions gracefully
- Recover from participant disconnections
- Maintain consent state during brief connection losses

#### NFR-3: Security
- Encrypt OAuth tokens at rest
- Validate all webhook signatures
- Never expose participant data in guest mode
- Follow OWASP security headers requirements

#### NFR-4: Scalability
- Support meetings with up to 100 participants
- Handle rapid join/leave scenarios
- Efficient state synchronization across instances

### 1.3 Platform Limitations & Constraints

#### PL-1: Mobile App Invitation Issues ⚠️ MEDIUM-HIGH
**Constraint:** Zoom Apps ARE supported on mobile platforms (iOS, Android), but app invitations may not reach mobile participants reliably.

**Impact on Consent Workflow:**
- Mobile participants CAN use the app, but may miss invitation notifications
- App invitations sent via `sendAppInvitationToAllParticipants()` may not deliver to mobile
- Mobile users must manually discover app via Apps menu in Zoom mobile client
- Creates UX friction and consent delays for 30-50% of meeting participants

**Investigation Needed:**
- Test app invitations on real iOS and Android devices
- Check if different API methods or settings are required for mobile
- Review Zoom SDK documentation for mobile-specific behavior
- Determine if this is a configuration issue or API limitation

**Workaround (if invitations cannot be fixed):**
1. **Chat-based consent fallback** - Mobile users type "I consent" in Zoom chat
2. **Manual app discovery instructions** - Show clear instructions in UI for mobile users
3. **Hybrid approach** - Desktop uses app, mobile uses chat fallback

**Production Consideration:** Not a complete blocker, but degrades UX for mobile participants. Investigate and implement fallback if needed.

**See:** `docs-from-claude/08-mobile-consent-solutions.md` for detailed fallback implementation options.

#### PL-2: OAuth Configuration Required
**Constraint:** OAuth redirect URL must be configured before app installation, even for demo/testing.

**Impact:** Developers must have ngrok URL ready before users can install the app.

#### PL-3: Domain Allowlist Required
**Constraint:** `appssdk.zoom.us` must be explicitly added to domain allowlist for SDK to load.

**Impact:** App will not load without this configuration. Common cause of "SDK not initialized" errors.

#### PL-4: RTMS Scopes Required
**Constraint:** RTMS media scopes (Transcripts, Audio, Video) must be explicitly enabled in app configuration.

**Impact:** `startRTMS()` calls will fail without proper scopes configured.

### 1.4 User Stories

#### US-1: Host Initiates Consent Process
**As a** meeting host
**I want to** start the consent app at the beginning of the meeting
**So that** I can collect consent before accessing RTMS transcripts

**Acceptance Criteria:**
- Host opens app in authenticated mode
- Host sees dashboard with participant list
- All participants receive consent prompt automatically
- Host can monitor consent collection progress

#### US-2: Participant Provides Consent
**As a** meeting participant
**I want to** clearly understand what I'm consenting to
**So that** I can make an informed decision

**Acceptance Criteria:**
- Clear consent language displayed
- Simple Agree/Disagree buttons
- Visual confirmation after clicking
- Cannot change decision after submission

#### US-3: Host Monitors RTMS Status
**As a** meeting host
**I want to** see real-time RTMS status
**So that** I know when transcript access is active

**Acceptance Criteria:**
- Dashboard shows "Running" / "Paused" / "Stopped"
- Reason for pause is displayed (e.g., new participant)
- Notification when RTMS starts/pauses/resumes

#### US-4: New Participant Joins Mid-Meeting
**As a** meeting host
**I want** RTMS to pause when a new participant joins
**So that** we comply with consent requirements

**Acceptance Criteria:**
- RTMS pauses within 3 seconds of new join
- Host sees notification: "RTMS paused: waiting for [Name]"
- New participant sees consent prompt
- RTMS resumes automatically after new participant consents

#### US-5: Guest Provides Consent Without Login
**As a** meeting participant
**I want to** provide consent without logging in
**So that** I can quickly participate

**Acceptance Criteria:**
- No login required
- Simple consent UI
- Confirmation of my consent status
- No access to other participants' information

### 1.4 Consent Workflow State Machine

```
                    ┌─────────────┐
                    │   Meeting   │
                    │   Starts    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  App Opens  │
                    │  for All    │
                    │ Participants│
                    └──────┬──────┘
                           │
                           ▼
                ┌────────────────────────┐
                │  Show Consent Prompt   │
                │  Status: PENDING       │
                └──────┬─────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │   User       │      │   User       │
    │  Clicks      │      │  Clicks      │
    │  "Agree"     │      │  "Disagree"  │
    └──────┬───────┘      └──────┬───────┘
           │                     │
           ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │  Status:     │      │  Status:     │
    │  AGREED      │      │  DISAGREED   │
    └──────┬───────┘      └──────┬───────┘
           │                     │
           │                     │
           └─────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │  Check All         │
            │  Participants      │
            └──────┬─────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌────────────────┐    ┌────────────────┐
│  All AGREED?   │    │  Any DISAGREED?│
│      YES       │    │      YES       │
└────────┬───────┘    └────────┬───────┘
         │                     │
         ▼                     ▼
┌────────────────┐    ┌────────────────┐
│  Start RTMS    │    │  RTMS Stays    │
│  Status:       │    │  Stopped       │
│  RUNNING       │    │  Notify Host   │
└────────┬───────┘    └────────────────┘
         │
         │  ┌───────────────┐
         │  │ New Participant│
         │◄─┤     Joins     │
         │  └───────────────┘
         │
         ▼
┌────────────────┐
│  Pause RTMS    │
│  Status:       │
│  PAUSED        │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Show Consent  │
│  Prompt to New │
│  Participant   │
└────────┬───────┘
         │
         │  ┌──────────────┐
         │  │ New User     │
         │◄─┤ Consents     │
         │  └──────────────┘
         │
         ▼
┌────────────────┐
│  Resume RTMS   │
│  Status:       │
│  RUNNING       │
└────────────────┘
```

---

## 2. Technical Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Zoom Client                              │
│                                                                 │
│  ┌───────────────┐              ┌───────────────┐             │
│  │  Host Mode    │              │  Guest Mode   │             │
│  │  (React App)  │              │  (React App)  │             │
│  │               │              │               │             │
│  │ - Full Dash   │◄────────────►│ - Consent UI  │             │
│  │ - Participant │   WebSocket  │ - Status Only │             │
│  │   List        │   Messages   │               │             │
│  │ - RTMS Ctrl   │              │               │             │
│  └───────┬───────┘              └───────┬───────┘             │
└──────────┼──────────────────────────────┼───────────────────────┘
           │                              │
           │          HTTPS/REST          │
           │                              │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │      Backend Server          │
           │      (Node.js/Express)       │
           │                              │
           │  - OAuth 2.0 / PKCE         │
           │  - Session Management       │
           │  - Consent State Store      │
           │  - WebSocket Server         │
           │  - RTMS Lifecycle Mgmt      │
           │  - Zoom API Proxy           │
           └──────────────┬───────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
      ┌──────────────────┐  ┌──────────────────┐
      │  Redis Store     │  │  RTMS Server     │
      │                  │  │                  │
      │  - Sessions      │  │  - Webhook Hndlr │
      │  - Tokens        │  │  - Stream Mgmt   │
      │  - Consent State │  │  - Transcript    │
      │  - Participant   │  │    Capture       │
      │    List          │  │                  │
      └──────────────────┘  └──────────────────┘
                                     ▲
                                     │
                          ┌──────────┴──────────┐
                          │  Zoom RTMS Server   │
                          │  (Webhooks)         │
                          └─────────────────────┘
```

### 2.2 Component Responsibilities

#### Frontend (React Application)
**Location:** `/frontend`

**Host Mode Components:**
- `HostDashboard.jsx` - Main dashboard with participant list and RTMS controls
- `ParticipantList.jsx` - Real-time list showing consent status per participant
- `RTMSStatus.jsx` - Display RTMS state (running/paused/stopped) with reason
- `ConsentPrompt.jsx` - Host's consent UI (same as guest, but with full context)

**Guest Mode Components:**
- `GuestView.jsx` - Minimal UI with consent prompt and status
- `ConsentPrompt.jsx` - Agree/Disagree buttons with clear language
- `ConsentStatus.jsx` - Visual confirmation of user's consent

**Shared Components:**
- `Authorization.jsx` - OAuth flow handling (host only)
- `ZoomSDKProvider.jsx` - SDK initialization and context

**State Management:**
```javascript
// Consent Context
{
  meetingId: string,
  currentUser: {
    participantId: string,
    isHost: boolean,
    consentStatus: 'pending' | 'agreed' | 'disagreed'
  },
  participants: [
    {
      participantId: string,
      participantUUID: string,
      screenName: string,
      consentStatus: 'pending' | 'agreed' | 'disagreed',
      joinedAt: timestamp
    }
  ],
  rtmsStatus: 'stopped' | 'running' | 'paused',
  rtmsPausedReason: string | null,
  unanimousConsent: boolean
}
```

#### Backend (Node.js/Express)
**Location:** `/backend`

**API Routes:**
- `POST /api/consent/submit` - Submit participant consent
- `GET /api/consent/status` - Get current consent state for meeting
- `GET /api/participants` - Get participant list with consent status (host only)
- `POST /api/rtms/start` - Manually start RTMS (host only)
- `POST /api/rtms/stop` - Manually stop RTMS (host only)
- `GET /api/zoomapp/authorize` - Get PKCE challenge (host only)
- `POST /api/zoomapp/onauthorized` - Exchange OAuth code (host only)

**Core Services:**
- `ConsentManager` - Track and validate consent state
- `ParticipantTracker` - Monitor joins/leaves via Zoom webhooks
- `RTMSController` - Manage RTMS lifecycle based on consent
- `WebSocketServer` - Real-time state sync to all clients
- `ZoomAPIClient` - Proxy Zoom REST API calls

**Key Algorithms:**

*Consent Validation:*
```javascript
function checkUnanimousConsent(participants) {
  // Must have at least one participant
  if (participants.length === 0) return false

  // All participants must have status 'agreed'
  return participants.every(p => p.consentStatus === 'agreed')
}
```

*RTMS State Machine:*
```javascript
async function handleConsentChange(meetingId) {
  const state = await getConsentState(meetingId)

  // Check if anyone disagreed
  if (state.participants.some(p => p.consentStatus === 'disagreed')) {
    await stopRTMS(meetingId)
    state.rtmsStatus = 'stopped'
    state.rtmsPausedReason = 'Participant declined consent'
    return
  }

  // Check for unanimous consent
  if (checkUnanimousConsent(state.participants)) {
    if (state.rtmsStatus === 'stopped' || state.rtmsStatus === 'paused') {
      await startRTMS(meetingId)
      state.rtmsStatus = 'running'
      state.rtmsPausedReason = null
    }
  } else {
    // Not everyone has consented yet
    if (state.rtmsStatus === 'running') {
      await stopRTMS(meetingId) // Pause
      state.rtmsStatus = 'paused'

      const pending = state.participants.filter(p => p.consentStatus === 'pending')
      state.rtmsPausedReason = `Waiting for: ${pending.map(p => p.screenName).join(', ')}`
    }
  }

  // Broadcast state to all clients
  broadcastStateUpdate(meetingId, state)
}
```

*Participant Join Handler:*
```javascript
async function handleParticipantJoin(meetingId, participant) {
  const state = await getConsentState(meetingId)

  // Add new participant with pending status
  state.participants.push({
    participantId: participant.id,
    participantUUID: participant.uuid,
    screenName: participant.screenName,
    consentStatus: 'pending',
    joinedAt: Date.now()
  })

  // If RTMS is running, pause it
  if (state.rtmsStatus === 'running') {
    await stopRTMS(meetingId)
    state.rtmsStatus = 'paused'
    state.rtmsPausedReason = `New participant joined: ${participant.screenName}`
  }

  await saveConsentState(meetingId, state)
  broadcastStateUpdate(meetingId, state)
}
```

#### RTMS Component
**Location:** `/rtms`

**Responsibilities:**
- Listen for `meeting.rtms_started` webhooks
- Connect to RTMS stream
- Capture transcript data
- Listen for `meeting.rtms_stopped` webhooks
- Save transcript to storage

**Integration:**
- Uses `@zoom/rtms` SDK (recommended approach)
- Backend calls `zoomSdk.startRTMS()` when unanimous consent achieved
- Backend calls `zoomSdk.stopRTMS()` to pause/stop

#### Redis Store
**Location:** Managed service or Docker container

**Data Structures:**
```javascript
// Meeting Consent State
Key: `consent:${meetingId}`
Value: {
  meetingId: string,
  meetingUUID: string,
  hostUserId: string,
  participants: [...],
  rtmsStatus: string,
  rtmsPausedReason: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
TTL: 24 hours

// Session Storage
Key: `sess:${sessionId}`
Value: {
  userId: string,
  tokens: {...},
  role: 'host' | 'guest',
  meetingId: string
}
TTL: 1 hour

// OAuth Tokens (Encrypted)
Key: `tokens:${userId}`
Value: {
  access_token: string (encrypted),
  refresh_token: string (encrypted),
  expires_at: timestamp
}
TTL: Based on token expiry
```

### 2.3 Data Flow Diagrams

#### Consent Submission Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌─────────┐
│  User   │         │ Frontend │         │ Backend │         │  Redis  │
│ (Guest) │         │          │         │         │         │         │
└────┬────┘         └────┬─────┘         └────┬────┘         └────┬────┘
     │                   │                    │                   │
     │ Click "Agree"     │                    │                   │
     ├──────────────────►│                    │                   │
     │                   │                    │                   │
     │                   │ POST /api/consent/submit              │
     │                   │ { meetingId, participantId,           │
     │                   │   consentStatus: 'agreed' }           │
     │                   ├───────────────────►│                   │
     │                   │                    │                   │
     │                   │                    │ Get Consent State │
     │                   │                    ├──────────────────►│
     │                   │                    │                   │
     │                   │                    │◄──────────────────┤
     │                   │                    │ Current State     │
     │                   │                    │                   │
     │                   │                    │ Update Participant│
     │                   │                    │ Consent Status    │
     │                   │                    │                   │
     │                   │                    │ Check Unanimous   │
     │                   │                    │ Consent           │
     │                   │                    │                   │
     │                   │                    │ All Agreed?       │
     │                   │                    ├───┐               │
     │                   │                    │   │ Yes           │
     │                   │                    │◄──┘               │
     │                   │                    │                   │
     │                   │                    │ zoomSdk.startRTMS()
     │                   │                    ├───┐               │
     │                   │                    │◄──┘               │
     │                   │                    │                   │
     │                   │                    │ Update RTMS Status│
     │                   │                    │ to 'running'      │
     │                   │                    ├──────────────────►│
     │                   │                    │                   │
     │                   │                    │ Save State        │
     │                   │                    │◄──────────────────┤
     │                   │                    │                   │
     │                   │                    │ Broadcast Update  │
     │                   │                    │ via WebSocket     │
     │                   │                    ├───┐               │
     │                   │                    │   │               │
     │                   │◄───────────────────┤◄──┘               │
     │                   │ 200 OK             │                   │
     │                   │ { success: true,   │                   │
     │                   │   rtmsStatus: ...} │                   │
     │                   │                    │                   │
     │◄──────────────────┤                    │                   │
     │ Show confirmation │                    │                   │
     │                   │                    │                   │
     │                   │ WebSocket Message  │                   │
     │◄──────────────────┤ State Update       │                   │
     │                   │                    │                   │
```

#### Participant Join Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Zoom    │      │ Backend  │      │  Redis   │      │All Clients│
│  Webhook │      │          │      │          │      │(WebSocket)│
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                  │                  │
     │ participant.    │                  │                  │
     │ joined event    │                  │                  │
     ├────────────────►│                  │                  │
     │                 │                  │                  │
     │                 │ Get Consent State│                  │
     │                 ├─────────────────►│                  │
     │                 │                  │                  │
     │                 │◄─────────────────┤                  │
     │                 │ Current State    │                  │
     │                 │                  │                  │
     │                 │ Add new participant                 │
     │                 │ status: 'pending'│                  │
     │                 │                  │                  │
     │                 │ Is RTMS running? │                  │
     │                 ├───┐              │                  │
     │                 │   │ Yes          │                  │
     │                 │◄──┘              │                  │
     │                 │                  │                  │
     │                 │ zoomSdk.stopRTMS()                  │
     │                 ├───┐              │                  │
     │                 │◄──┘              │                  │
     │                 │                  │                  │
     │                 │ Update State:    │                  │
     │                 │ - rtmsStatus = 'paused'             │
     │                 │ - pausedReason = "New: John Doe"    │
     │                 │                  │                  │
     │                 │ Save State       │                  │
     │                 ├─────────────────►│                  │
     │                 │                  │                  │
     │                 │ Broadcast State  │                  │
     │                 │ Update           │                  │
     │                 ├─────────────────────────────────────►│
     │                 │                  │                  │
     │                 │                  │     ┌────────────┤
     │                 │                  │     │ All clients│
     │                 │                  │     │ show:      │
     │                 │                  │     │ "RTMS      │
     │                 │                  │     │  Paused"   │
     │                 │                  │     └────────────┤
     │                 │                  │                  │
```

### 2.4 State Synchronization Strategy

All app instances (host and guests) must maintain synchronized state. This is achieved through:

#### WebSocket Communication
- Backend runs WebSocket server
- All frontend instances connect on app load
- Backend broadcasts state changes to all connected clients
- Clients update local state reactively

#### State Update Events
```javascript
// Events broadcast to all clients
{
  event: 'consent_updated',
  meetingId: string,
  participant: {
    participantId: string,
    screenName: string,
    consentStatus: 'agreed' | 'disagreed'
  }
}

{
  event: 'rtms_status_changed',
  meetingId: string,
  rtmsStatus: 'running' | 'paused' | 'stopped',
  pausedReason: string | null
}

{
  event: 'participant_joined',
  meetingId: string,
  participant: {...}
}

{
  event: 'participant_left',
  meetingId: string,
  participantId: string
}

{
  event: 'full_state',
  meetingId: string,
  state: {...} // Complete consent state
}
```

#### Client-Side State Management
- React Context for global state
- WebSocket listener updates context
- Components subscribe to context changes
- Optimistic UI updates with server confirmation

---

## 3. API Integration Plan

### 3.1 Zoom Apps SDK Methods Required

#### Essential Methods
```javascript
// Configuration
zoomSdk.config({
  capabilities: [
    // Meeting Context
    'getMeetingContext',
    'getMeetingUUID',
    'getMeetingParticipants',
    'getRunningContext',

    // User Context
    'getUserContext',
    'authorize',
    'onAuthorized',
    'onMyUserContextChange',

    // Participant Events
    'onParticipantChange',

    // RTMS Control
    'startRTMS',
    'stopRTMS',

    // Multi-Instance Communication
    'connect',
    'postMessage',
    'onMessage',
    'onConnect',

    // UI
    'showNotification',
    'sendAppInvitationToAllParticipants'
  ],
  version: '0.16.0'
})
```

#### SDK Usage Patterns

**1. Initialize and Get Context**
```javascript
async function initializeApp() {
  // Configure SDK
  const configResponse = await zoomSdk.config({...})

  // Get running context
  const { context } = await zoomSdk.getRunningContext()
  // context: 'inMeeting'

  // Get user context
  const userContext = await zoomSdk.getUserContext()
  // { status: 'authorized', role: 'host', screenName: 'John Doe' }

  // Get meeting context
  const meetingContext = await zoomSdk.getMeetingContext()
  // { meetingUUID, meetingID, role, participantUUID }

  return { configResponse, context, userContext, meetingContext }
}
```

**2. Track Participants in Real-Time**
```javascript
async function trackParticipants() {
  // Get initial participant list
  const { participants } = await zoomSdk.getMeetingParticipants()

  // Listen for changes
  zoomSdk.addEventListener('onParticipantChange', async (event) => {
    console.log('Participant change:', event)

    // Refresh participant list
    const { participants: updatedList } = await zoomSdk.getMeetingParticipants()

    // Detect new joins
    const newParticipants = updatedList.filter(p =>
      !participants.some(existing => existing.participantUUID === p.participantUUID)
    )

    if (newParticipants.length > 0) {
      // Notify backend of new joins
      await notifyBackendOfNewParticipants(newParticipants)
    }
  })
}
```

**3. Control RTMS**
```javascript
async function startRTMS() {
  try {
    await zoomSdk.callZoomApi('startRTMS')
    console.log('RTMS started successfully')
    return { success: true }
  } catch (error) {
    console.error('RTMS start failed:', error)
    return { success: false, error }
  }
}

async function stopRTMS() {
  try {
    await zoomSdk.callZoomApi('stopRTMS')
    console.log('RTMS stopped successfully')
    return { success: true }
  } catch (error) {
    console.error('RTMS stop failed:', error)
    return { success: false, error }
  }
}
```

**4. Handle In-Client OAuth (Host Only)**
```javascript
async function authenticateHost() {
  // Step 1: Get PKCE challenge from backend
  const { codeChallenge, state } = await fetch('/api/zoomapp/authorize')
    .then(res => res.json())

  // Step 2: Call authorize SDK method
  await zoomSdk.authorize({ codeChallenge, state })

  // Step 3: Listen for authorization completion
  zoomSdk.addEventListener('onAuthorized', async (event) => {
    const { code, state } = event

    // Step 4: Exchange code for token on backend
    await fetch('/api/zoomapp/onauthorized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state, href: window.location.href })
    })

    console.log('Host authenticated successfully')
  })
}
```

**5. Synchronize Multi-Instance State**
```javascript
async function syncInstances() {
  const { context } = await zoomSdk.getRunningContext()

  if (context === 'inMeeting') {
    // Meeting instance: connect and send state
    zoomSdk.addEventListener('onConnect', () => {
      console.log('Instances connected')

      // Send current state to main client
      zoomSdk.postMessage({
        payload: {
          type: 'state_sync',
          data: getCurrentState()
        }
      })
    })

    await zoomSdk.connect()
  } else if (context === 'inMainClient') {
    // Main client: receive state updates
    zoomSdk.addEventListener('onMessage', (event) => {
      const { type, data } = event.payload.payload

      if (type === 'state_sync') {
        updateLocalState(data)
      }
    })
  }
}
```

### 3.2 Zoom REST API Endpoints

#### Via Backend Proxy
```javascript
// Get current user info (host only)
GET /zoom/api/v2/users/me

// Get meeting details
GET /zoom/api/v2/meetings/{meetingId}

// Get meeting participants (alternative to SDK method)
GET /zoom/api/v2/metrics/meetings/{meetingId}/participants
```

### 3.3 Zoom Webhooks Required

#### Marketplace Configuration

**Event Subscriptions:**
- `meeting.started` - Detect when meeting begins
- `meeting.ended` - Cleanup when meeting ends
- `meeting.participant_joined` - New participant joins (backup for SDK events)
- `meeting.participant_left` - Participant leaves (backup for SDK events)
- `meeting.rtms_started` - RTMS stream started
- `meeting.rtms_stopped` - RTMS stream stopped
- `endpoint.url_validation` - Webhook verification

**Webhook Endpoint:**
```
POST https://your-domain.com/api/webhooks/zoom
```

#### Webhook Handler
```javascript
app.post('/api/webhooks/zoom', async (req, res) => {
  const { event, payload } = req.body

  switch (event) {
    case 'endpoint.url_validation':
      return handleUrlValidation(payload, res)

    case 'meeting.participant_joined':
      await handleParticipantJoin(payload)
      break

    case 'meeting.participant_left':
      await handleParticipantLeft(payload)
      break

    case 'meeting.rtms_started':
      await handleRTMSStarted(payload)
      break

    case 'meeting.rtms_stopped':
      await handleRTMSStopped(payload)
      break
  }

  res.sendStatus(200)
})
```

### 3.4 Authentication Strategy

#### Host Authentication
- **Method:** In-Client OAuth with PKCE
- **Flow:**
  1. Frontend requests PKCE challenge from backend
  2. Frontend calls `zoomSdk.authorize()`
  3. User completes OAuth in Zoom UI
  4. `onAuthorized` event fires with code
  5. Backend exchanges code for access token
  6. Access token stored in Redis (encrypted)
  7. Session created with host role

#### Guest Authentication
- **Method:** None (anonymous access)
- **Validation:** Session tied to meeting ID only
- **Permissions:** Can only submit consent, no data access

#### Session Management
```javascript
// Host session
{
  userId: string,        // Zoom user ID
  role: 'host',
  meetingId: string,
  tokens: {
    access_token: string,
    refresh_token: string,
    expires_at: number
  }
}

// Guest session
{
  guestId: string,       // Random UUID
  role: 'guest',
  meetingId: string,
  participantId: string  // From meeting context
}
```

---

## 4. Development Phases

### Phase 1: Foundation Setup (Week 1)

**Goals:** Project scaffolding, SDK initialization, basic UI

**Tasks:**
1. Initialize React project with Create React App
2. Set up Express backend with Redis
3. Configure Docker Compose for local development
4. Create `.env.example` and environment configuration
5. Implement SDK initialization in frontend
6. Create basic routing (host vs guest detection)
7. Set up WebSocket server and client connection

**Deliverables:**
- Working dev environment with Docker
- SDK successfully initialized
- Host/Guest mode detection working
- WebSocket connection established

**Success Criteria:**
- App loads in Zoom client
- Console shows SDK configuration success
- WebSocket connection confirmed in browser DevTools

---

### Phase 2: Consent UI & State Management (Week 1-2)

**Goals:** Build consent UI for both modes, implement state management

**Tasks:**
1. Create `ConsentContext` React context
2. Build `ConsentPrompt` component with Agree/Disagree buttons
3. Build `GuestView` component (minimal UI)
4. Build `HostDashboard` component (empty shell)
5. Implement consent submission to backend
6. Create backend API: `POST /api/consent/submit`
7. Implement consent state storage in Redis
8. Test consent submission flow end-to-end

**Deliverables:**
- Guest can see consent prompt and click buttons
- Host can see consent prompt
- Consent status persists in Redis
- UI shows confirmation after consent

**Success Criteria:**
- Guest clicks "Agree" → sees confirmation
- Backend logs show consent saved
- Redis contains consent state for meeting

---

### Phase 3: Participant Tracking (Week 2)

**Goals:** Real-time participant list with consent status

**Tasks:**
1. Implement `getMeetingParticipants()` on app load
2. Set up `onParticipantChange` event listener
3. Create backend API: `GET /api/participants`
4. Build `ParticipantList` component for host dashboard
5. Implement participant join detection
6. Implement participant leave detection
7. Set up webhook handlers for participant events
8. Test with multiple participants joining/leaving

**Deliverables:**
- Host dashboard shows all participants
- Consent status displayed per participant
- Real-time updates when participants join/leave
- Participant count accurate

**Success Criteria:**
- Host sees list of all meeting participants
- New participant appears in list within 2 seconds
- Participant who leaves disappears from list
- Consent status shown correctly per participant

---

### Phase 4: RTMS Integration (Week 2-3)

**Goals:** Implement RTMS lifecycle based on consent

**Tasks:**
1. Add `startRTMS` and `stopRTMS` to SDK capabilities
2. Implement unanimous consent checker
3. Create RTMS state machine in backend
4. Implement automatic RTMS start when all consent
5. Test RTMS start/stop via SDK
6. Set up RTMS webhook handlers (`rtms_started`, `rtms_stopped`)
7. Implement RTMS server to capture transcripts
8. Build `RTMSStatus` component for host dashboard
9. Test full RTMS flow with real meeting

**Deliverables:**
- RTMS starts automatically when all participants consent
- RTMS status displayed on host dashboard
- Transcripts captured and saved
- RTMS stops on meeting end

**Success Criteria:**
- 2 participants agree → RTMS starts automatically
- Host sees "RTMS Running" status
- RTMS webhook events received
- Transcript file created in `rtms/app/data/transcripts/`

---

### Phase 5: Dynamic Consent & Pause/Resume (Week 3)

**Goals:** Handle new participants joining mid-meeting

**Tasks:**
1. Implement new participant join handler in backend
2. Add logic to pause RTMS when new participant joins
3. Detect when new participant consents
4. Implement RTMS resume logic
5. Update host dashboard to show pause reason
6. Implement notifications for pause/resume events
7. Test rapid join/leave scenarios
8. Handle edge case: participant reconnects

**Deliverables:**
- RTMS pauses within 3 seconds of new join
- New participant sees consent prompt
- RTMS resumes when new participant consents
- Host sees reason for pause

**Success Criteria:**
- RTMS running → new participant joins → RTMS pauses
- Host sees "Paused: Waiting for [Name]"
- New participant agrees → RTMS resumes
- All participants notified of state changes

---

### Phase 6: Host Authentication (Week 3-4)

**Goals:** Implement OAuth flow for host

**Tasks:**
1. Set up backend OAuth routes (`/api/zoomapp/authorize`, `/api/zoomapp/onauthorized`)
2. Implement PKCE challenge generation
3. Build `Authorization` component for host
4. Implement `zoomSdk.authorize()` flow
5. Handle `onAuthorized` event
6. Implement token exchange on backend
7. Store encrypted tokens in Redis
8. Implement automatic token refresh
9. Test OAuth flow end-to-end

**Deliverables:**
- Host can log in via Zoom OAuth
- Tokens stored securely
- Session persists across page refresh
- Token refresh works automatically

**Success Criteria:**
- Host clicks "Login" → Zoom OAuth modal appears
- After authorization, host session created
- Host can access participant list
- Tokens encrypted in Redis

---

### Phase 7: State Synchronization (Week 4)

**Goals:** Sync state across all app instances

**Tasks:**
1. Implement WebSocket broadcast for state changes
2. Set up frontend WebSocket listeners
3. Test state sync with multiple browser windows
4. Implement optimistic UI updates
5. Handle WebSocket reconnection
6. Implement state recovery after reconnection
7. Test with host + multiple guests simultaneously

**Deliverables:**
- All clients see same state
- Consent updates appear on all screens
- RTMS status synced across instances
- State persists through brief disconnections

**Success Criteria:**
- Guest 1 consents → Host sees update immediately
- RTMS starts → All guests see "RTMS Running"
- New participant joins → All see participant list update
- State consistency maintained with 3+ clients

---

### Phase 8: Error Handling & Edge Cases (Week 4-5)

**Goals:** Robust error handling and edge case coverage

**Tasks:**
1. Implement SDK method error handling
2. Add user-friendly error messages
3. Handle RTMS start/stop failures
4. Handle participant reconnections
5. Handle rapid consent changes
6. Implement meeting end cleanup
7. Add logging and monitoring
8. Test all error scenarios

**Deliverables:**
- Graceful error handling throughout app
- Clear error messages to users
- No unhandled promise rejections
- Meeting cleanup on end

**Success Criteria:**
- RTMS fails to start → User sees error message
- Network drops → App recovers on reconnection
- Meeting ends → All state cleaned up
- No crashes in error scenarios

---

### Phase 9: UI Polish & UX (Week 5)

**Goals:** Professional UI and smooth user experience

**Tasks:**
1. Apply Bootstrap styling consistently
2. Add loading states to all async operations
3. Implement transition animations
4. Add icons and visual indicators
5. Improve consent prompt language
6. Add tooltips and help text
7. Make UI responsive (mobile support)
8. Conduct UX review and iterate

**Deliverables:**
- Professional, polished UI
- Smooth transitions and animations
- Clear visual hierarchy
- Mobile-friendly design

**Success Criteria:**
- UI looks professional and cohesive
- All buttons have clear hover states
- Loading indicators during operations
- Works on tablet/mobile

---

### Phase 10: Testing & Documentation (Week 5-6)

**Goals:** Comprehensive testing and documentation

**Tasks:**
1. Write unit tests for backend logic
2. Write integration tests for API endpoints
3. Test with various meeting sizes (2, 10, 50 participants)
4. Load test WebSocket connections
5. Security audit of OAuth flow
6. Create user documentation
7. Create developer documentation
8. Record demo video

**Deliverables:**
- Test coverage > 80%
- All edge cases tested
- User guide document
- Developer setup guide
- Demo video

**Success Criteria:**
- All tests pass
- App works with 50+ participants
- Security vulnerabilities addressed
- Documentation complete

---

## 5. File Structure

```
/zoom-consent-rtms-app/
│
├── frontend/                           # React application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── index.js                   # React entry point
│   │   ├── App.js                     # Main app component
│   │   ├── App.css
│   │   │
│   │   ├── components/
│   │   │   ├── HostDashboard.jsx      # Host main view
│   │   │   ├── GuestView.jsx          # Guest main view
│   │   │   ├── ConsentPrompt.jsx      # Consent UI (shared)
│   │   │   ├── ConsentStatus.jsx      # Consent confirmation
│   │   │   ├── ParticipantList.jsx    # Participant list (host)
│   │   │   ├── RTMSStatus.jsx         # RTMS status display
│   │   │   ├── Authorization.jsx      # OAuth flow (host)
│   │   │   └── Header.jsx             # App header
│   │   │
│   │   ├── contexts/
│   │   │   ├── ConsentContext.jsx     # Consent state management
│   │   │   ├── ZoomSDKContext.jsx     # SDK initialization
│   │   │   └── WebSocketContext.jsx   # WS connection
│   │   │
│   │   ├── hooks/
│   │   │   ├── useZoomAuth.js         # OAuth hook
│   │   │   ├── useParticipants.js     # Participant tracking
│   │   │   ├── useConsent.js          # Consent management
│   │   │   ├── useRTMS.js             # RTMS control
│   │   │   └── useWebSocket.js        # WebSocket hook
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                 # API client
│   │   │   ├── zoomSdk.js             # SDK wrapper
│   │   │   └── websocket.js           # WebSocket client
│   │   │
│   │   └── utils/
│   │       ├── constants.js           # App constants
│   │       └── helpers.js             # Helper functions
│   │
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── backend/                            # Node.js/Express server
│   ├── src/
│   │   ├── server.js                  # Express app setup
│   │   ├── config.js                  # Environment config
│   │   │
│   │   ├── routes/
│   │   │   ├── consent.js             # Consent API routes
│   │   │   ├── participants.js        # Participant API routes
│   │   │   ├── rtms.js                # RTMS control routes
│   │   │   ├── zoomapp.js             # OAuth routes
│   │   │   └── webhooks.js            # Zoom webhooks
│   │   │
│   │   ├── controllers/
│   │   │   ├── consentController.js   # Consent logic
│   │   │   ├── participantController.js # Participant logic
│   │   │   ├── rtmsController.js      # RTMS logic
│   │   │   ├── oauthController.js     # OAuth logic
│   │   │   └── webhookController.js   # Webhook handlers
│   │   │
│   │   ├── services/
│   │   │   ├── ConsentManager.js      # Consent state mgmt
│   │   │   ├── ParticipantTracker.js  # Participant tracking
│   │   │   ├── RTMSController.js      # RTMS lifecycle
│   │   │   ├── ZoomAPIClient.js       # Zoom API wrapper
│   │   │   └── WebSocketServer.js     # WS server
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                # Authentication
│   │   │   ├── session.js             # Session management
│   │   │   ├── security.js            # Security headers
│   │   │   └── errorHandler.js        # Error handling
│   │   │
│   │   └── utils/
│   │       ├── redis.js               # Redis client
│   │       ├── encryption.js          # Token encryption
│   │       ├── logger.js              # Logging
│   │       └── validators.js          # Input validation
│   │
│   ├── tests/
│   │   ├── consent.test.js
│   │   ├── participants.test.js
│   │   └── rtms.test.js
│   │
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── rtms/                               # RTMS component
│   ├── sdk/                           # @zoom/rtms implementation
│   │   ├── index.js                   # Main RTMS handler
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── utils/                         # Shared utilities
│   │   ├── audio.js                   # WAV conversion
│   │   ├── video.js                   # MP4 conversion
│   │   └── transcript.js              # Text processing
│   │
│   └── app/
│       └── data/                      # Output directory
│           ├── audio/
│           ├── video/
│           └── transcripts/
│
├── docs/                              # Documentation
│   ├── ARCHITECTURE.md                # This file
│   ├── API.md                         # API documentation
│   ├── SETUP.md                       # Setup instructions
│   └── USER_GUIDE.md                  # User guide
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # CI/CD pipeline
│
├── docker-compose.yml                 # Multi-container setup
├── .env.example                       # Environment template
├── .gitignore
└── README.md
```

---

## 6. Technology Stack

### Frontend
- **Framework:** React 17+
- **Router:** React Router v6
- **State Management:** React Context API
- **Styling:** Bootstrap 5
- **HTTP Client:** Fetch API / Axios
- **WebSocket:** Native WebSocket API
- **SDK:** Zoom Apps SDK (JavaScript)

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express 4.x
- **Session Store:** Redis
- **WebSocket:** ws library
- **HTTP Client:** node-fetch
- **Encryption:** crypto module (AES-256)
- **Validation:** joi / express-validator

### Database & Caching
- **Redis:** Session storage, token cache, consent state

### RTMS
- **SDK:** @zoom/rtms (official)
- **Media Processing:** ffmpeg (for audio/video conversion)

### Development Tools
- **Containerization:** Docker, Docker Compose
- **Tunneling:** ngrok (for local development)
- **Testing:** Jest, Supertest
- **Linting:** ESLint
- **Formatting:** Prettier

### Deployment
- **Hosting:** AWS, Azure, or any Node.js host
- **Redis:** AWS ElastiCache, Redis Cloud, or self-hosted
- **CI/CD:** GitHub Actions
- **Monitoring:** CloudWatch, Datadog, or similar

---

## 7. Security Considerations

### Authentication & Authorization
- **OAuth 2.0 with PKCE:** Prevent authorization code interception
- **Token Encryption:** AES-256 encryption for tokens in Redis
- **Session Management:** Secure, httpOnly cookies with SameSite=Strict
- **Role-Based Access:** Host vs Guest permissions enforced

### Data Protection
- **No PII in Guest Mode:** Guests cannot see other participants' data
- **Consent Data Privacy:** Consent state only shared with host
- **RTMS Transcript Security:** Transcripts stored securely, access logged
- **Redis Encryption:** All sensitive data encrypted at rest

### Network Security
- **HTTPS Only:** All communication over TLS
- **OWASP Headers:** Content-Security-Policy, X-Content-Type-Options, etc.
- **Webhook Validation:** Verify Zoom webhook signatures
- **CORS Configuration:** Restrict origins to trusted domains

### Input Validation
- **Sanitize All Inputs:** Prevent XSS and injection attacks
- **Validate Meeting IDs:** Ensure meeting exists and is active
- **Rate Limiting:** Prevent abuse of consent submission endpoint
- **Schema Validation:** Use joi/validator for all API inputs

### Error Handling
- **No Information Leakage:** Generic error messages to clients
- **Detailed Logging:** Log errors with context (server-side only)
- **Graceful Degradation:** App functions even if RTMS fails

### Compliance Considerations
- **GDPR:** Ensure consent data handling complies
- **Data Retention:** Implement cleanup policies for old consent data
- **Audit Trail:** Log all RTMS start/stop actions with user context

---

## 8. Zoom Marketplace Configuration

### App Information
- **App Name:** RTMS Consent Manager
- **Short Description:** Collect participant consent before accessing meeting transcripts
- **Long Description:** [Detailed description of app functionality]
- **Category:** Productivity, Communication

### App Credentials
- **Client ID:** (Generated by Zoom)
- **Client Secret:** (Generated by Zoom)
- **Redirect URL:** `https://your-domain.com/api/zoomapp/auth`

### Features Configuration

#### Zoom App SDK
**Add APIs (Capabilities):**
- getMeetingContext
- getMeetingUUID
- getMeetingParticipants
- getRunningContext
- getUserContext
- authorize
- onAuthorized
- onMyUserContextChange
- onParticipantChange
- startRTMS
- stopRTMS
- connect
- postMessage
- onMessage
- onConnect
- showNotification
- sendAppInvitationToAllParticipants

#### Scopes
**OAuth Scopes Required:**
- `meeting:read:meeting` - Read meeting information
- `meeting:read:participant` - Read participant list
- `meeting:read:meeting_audio` - Access meeting audio (RTMS)
- `meeting:read:meeting_transcript` - Access meeting transcripts (RTMS)

**Note:** RTMS scopes require approval from Zoom

#### Event Subscriptions
**Webhook URL:** `https://your-domain.com/api/webhooks/zoom`

**Event Types:**
- meeting.started
- meeting.ended
- meeting.participant_joined
- meeting.participant_left
- meeting.rtms_started
- meeting.rtms_stopped
- endpoint.url_validation

#### App URLs
- **Home URL:** `https://your-domain.com/api/zoomapp/home`
- **Direct Landing URL:** `https://your-domain.com/api/zoomapp/install`

---

## 9. Testing Strategy

### Unit Tests
- Consent state management logic
- RTMS state machine transitions
- Unanimous consent checker
- Token encryption/decryption
- Webhook signature validation

### Integration Tests
- Consent submission API endpoint
- Participant join/leave handling
- RTMS start/stop lifecycle
- OAuth flow end-to-end
- WebSocket communication

### End-to-End Tests
- Full consent flow with 2 participants
- New participant joins mid-meeting
- RTMS pause and resume
- Host dashboard displays correct state
- Guest mode shows correct UI

### Performance Tests
- Load test with 50+ participants
- WebSocket connection scaling
- Rapid consent submissions
- Rapid participant join/leave

### Security Tests
- OAuth flow security
- Token encryption validation
- Input sanitization
- CORS configuration
- Webhook signature verification

### Edge Case Tests
- Participant reconnects after disconnect
- All participants disagree
- RTMS fails to start
- Meeting ends during RTMS
- Network interruption during consent
- Duplicate consent submissions

---

## 10. Success Criteria

### Functional Success
- ✅ All participants see consent prompt on app open
- ✅ Host dashboard shows real-time participant list with consent status
- ✅ RTMS starts automatically when all participants consent
- ✅ RTMS pauses within 3 seconds when new participant joins
- ✅ RTMS resumes when new participant consents
- ✅ Guest mode works without authentication
- ✅ Host mode requires OAuth login
- ✅ State synchronizes correctly across all instances
- ✅ No RTMS access before unanimous consent

### Non-Functional Success
- ✅ Participant join detection < 2 seconds
- ✅ RTMS pause response < 3 seconds
- ✅ Consent state sync < 1 second
- ✅ Supports 100+ participants
- ✅ No data leaks in guest mode
- ✅ All tokens encrypted at rest
- ✅ OWASP headers configured
- ✅ 80%+ test coverage

### User Experience Success
- ✅ Consent language is clear and understandable
- ✅ UI is professional and polished
- ✅ Loading states shown during async operations
- ✅ Error messages are user-friendly
- ✅ Works on desktop and mobile
- ✅ Host dashboard is intuitive
- ✅ Guest UI is minimal and focused

---

## 11. Risks & Mitigations

### Risk 1: Participant Join Detection Delay
**Impact:** RTMS may continue running for 2-3 seconds after new join
**Likelihood:** Medium
**Mitigation:**
- Use both SDK events and webhook events (redundancy)
- Log all detection timestamps for monitoring
- Accept 2-3 second delay as reasonable for POC

### Risk 2: RTMS API Rate Limiting
**Impact:** Cannot pause/resume RTMS frequently
**Likelihood:** Low
**Mitigation:**
- Implement exponential backoff
- Queue RTMS commands if rate limited
- Monitor Zoom API rate limits

### Risk 3: WebSocket Connection Drops
**Impact:** State desynchronization across clients
**Likelihood:** Medium
**Mitigation:**
- Implement automatic reconnection
- Send full state snapshot on reconnection
- Use polling fallback if WebSocket unavailable

### Risk 4: Participant Disconnects During Consent
**Impact:** Cannot get consent from disconnected participant
**Likelihood:** Medium
**Mitigation:**
- Mark disconnected participants as "left"
- Allow RTMS to start if all present participants consent
- Pause again if they rejoin

### Risk 5: RTMS Enablement Required
**Impact:** RTMS features won't work without Zoom approval
**Likelihood:** High
**Mitigation:**
- Contact Zoom account team early
- Prepare demo/justification for RTMS access
- Have fallback: app demonstrates consent flow without actual RTMS

### Risk 6: Complex State Management
**Impact:** Bugs in consent state synchronization
**Likelihood:** Medium
**Mitigation:**
- Implement comprehensive logging
- Write extensive tests for state machine
- Use Redux DevTools for debugging
- Start with simple state, add complexity incrementally

---

## 12. Future Enhancements

### Phase 2 Features (Post-POC)
1. **Consent History:** Show when each participant consented
2. **Consent Revocation:** Allow participants to revoke consent mid-meeting
3. **Customizable Consent Language:** Host can edit consent text
4. **Multi-Language Support:** Translate consent prompt
5. **Email Notifications:** Notify host when consent issues arise
6. **Audit Logging:** Track all RTMS access for compliance
7. **Admin Dashboard:** View consent history across all meetings
8. **Consent Templates:** Pre-configured consent scenarios
9. **Grace Period:** Continue RTMS for X seconds after new join (configurable)
10. **Participant Notifications:** In-meeting notifications about RTMS status

### Scalability Enhancements
- Horizontal scaling with multiple backend instances
- Redis cluster for distributed state
- Message queue (RabbitMQ/SQS) for async processing
- CDN for frontend assets

### Analytics & Monitoring
- Consent rate metrics
- RTMS uptime percentage
- Participant join latency tracking
- Error rate monitoring
- User behavior analytics

---

## 13. Glossary

**RTMS:** Real-Time Media Streams - Zoom's service for accessing live audio, video, and transcript data from meetings

**Unanimous Consent:** All participants have clicked "Agree" on the consent prompt

**Host Mode:** Authenticated app view with full dashboard and controls, requires Zoom OAuth

**Guest Mode:** Anonymous app view with minimal UI, no authentication required

**PKCE:** Proof Key for Code Exchange - OAuth security extension for public clients

**Consent State:** Current status of consent for all participants in a meeting

**Participant UUID:** Unique identifier for a participant in a specific meeting instance

**Meeting UUID:** Unique identifier for a specific meeting occurrence

**WebSocket:** Protocol for real-time, bi-directional communication between client and server

**State Synchronization:** Keeping consent state consistent across all app instances (host and guests)

---

## 14. References

- [Zoom Apps SDK Documentation](https://developers.zoom.us/docs/zoom-apps/)
- [Zoom RTMS Documentation](https://developers.zoom.us/docs/zoom-apps/rtms/)
- [Zoom OAuth Documentation](https://developers.zoom.us/docs/integrations/oauth/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [React Context API](https://react.dev/reference/react/useContext)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

## Appendix A: Environment Variables

```bash
# Zoom App Credentials
ZOOM_APP_CLIENT_ID=your_client_id
ZOOM_APP_CLIENT_SECRET=your_client_secret
ZOOM_APP_REDIRECT_URI=https://your-domain.com/api/zoomapp/auth

# Public URL
PUBLIC_URL=https://your-domain.com

# Security Keys
SESSION_SECRET=generate_32_byte_random_string
REDIS_ENCRYPTION_KEY=generate_32_char_string

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# RTMS (if using)
ZOOM_SECRET_TOKEN=your_webhook_secret
RTMS_PORT=3002

# Logging
LOG_LEVEL=info
DEBUG=false
```

---

## Appendix B: API Endpoints Summary

### Consent APIs
- `POST /api/consent/submit` - Submit participant consent
- `GET /api/consent/status?meetingId={id}` - Get consent state
- `DELETE /api/consent/reset?meetingId={id}` - Reset consent (admin)

### Participant APIs
- `GET /api/participants?meetingId={id}` - Get participant list (host only)

### RTMS APIs
- `POST /api/rtms/start` - Manually start RTMS (host only)
- `POST /api/rtms/stop` - Manually stop RTMS (host only)
- `GET /api/rtms/status?meetingId={id}` - Get RTMS status

### OAuth APIs
- `GET /api/zoomapp/home` - App home (Zoom client entry point)
- `GET /api/zoomapp/install` - Initiate web OAuth
- `GET /api/zoomapp/auth` - OAuth callback
- `GET /api/zoomapp/authorize` - Get PKCE challenge (host)
- `POST /api/zoomapp/onauthorized` - Exchange OAuth code (host)

### Webhook APIs
- `POST /api/webhooks/zoom` - Zoom webhook receiver

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Author:** Architecture Team
**Status:** Draft for Review
