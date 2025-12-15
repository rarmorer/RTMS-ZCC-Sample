# Project Status - Zoom Consent RTMS App

**Last Updated:** 2025-11-24
**Demo State:** ✅ RTMS Integration + Chat Consent (70%) - Transcript capture working, chat fallback implemented
**Environment:** Development (Docker + ngrok)
**Production Ready:** Phase 6 (OAuth) and Phase 11 testing (Chat Consent) required for external participants

---

## 🎯 Current Demo State

### ✅ What's Working

The app is **fully functional for multi-participant consent workflow demonstration** in Zoom meetings:

#### Core Features
- ✅ **App loads in Zoom meeting** via ngrok tunnel
- ✅ **Zoom SDK initialized** with complete meeting context (meetingUUID, participantUUID, screenName)
- ✅ **Host/Guest detection** based on meeting role
- ✅ **Consent UI** with clear Agree/Disagree buttons
- ✅ **Real-time participant tracking** (<500ms SDK-based detection)
- ✅ **Automatic app invitations** - New participants receive invitation to open app
- ✅ **Participant list** on host dashboard with consent status badges
- ✅ **WebSocket state synchronization** across all app instances
- ✅ **Unanimous consent detection** (all participants must agree)
- ✅ **URL encoding handled correctly** for meeting IDs with special characters
- ✅ **Webhook vs SDK UUID reconciliation** - SDK is authoritative source
- ✅ **RTMS Integration (Phase 4 - COMPLETE):**
  - Frontend calls `zoomSdk.callZoomApi('startRTMS')` when unanimous consent achieved
  - Zoom webhook forwarded from backend to RTMS server
  - RTMS server connects to WebSocket stream via `@zoom/rtms` SDK
  - Real-time transcript capture to disk
  - Starts when all participants consent
  - Pauses when new participant joins
  - Resumes when new participant consents
  - Shows pause reason on UI
  - **Tested with real RTMS stream - transcripts captured successfully**
- ⚠️ **Chat-Based Consent (Phase 11 - 70% COMPLETE):**
  - Chat message listener using `zoomSdk.onMessage()` API
  - Keyword detection for consent ("I consent", "I agree", "I decline", etc.)
  - Participant matching by sender ID/name
  - Automatic consent submission on behalf of chat sender
  - UI shows chat instructions on ConsentPrompt and ParticipantList
  - **Implementation complete - Testing with external participant pending**

#### Technical Features
- ✅ **Docker Compose** multi-container setup (backend, frontend, Redis)
- ✅ **Redis** for session storage and consent state persistence
- ✅ **Socket.IO WebSocket** for real-time updates
- ✅ **Enhanced SDK initialization** with multiple API calls merged (getMeetingContext + getMeetingUUID + getUserContext)
- ✅ **SDK error logging** with `getSupportedJsApis()` debugging
- ✅ **URL encoding** for query parameters with special characters
- ✅ **Validation** to prevent 400 errors (null checks on meeting context)
- ✅ **SDK-first participant tracking** - Webhooks provide backup only
- ✅ **Participant sync reconciliation** - SDK list replaces webhook-added participants
- ✅ **Automatic app invitation system** via `sendAppInvitationToAllParticipants`

#### UI Components
- ✅ **HostDashboard**: Full dashboard with participant list, RTMS status, meeting info
- ✅ **GuestView**: Minimal consent-only UI
- ✅ **ConsentPrompt**: Agree/Disagree buttons with loading states
- ✅ **ParticipantList**: Color-coded badges (green=agreed, yellow=pending, red=declined)
- ✅ **RTMSStatus**: Status display with pause reasons
- ✅ **ConsentNotification**: Real-time notifications for state changes

---

## 🐛 Bugs Fixed (2025-11-24)

### Critical Fixes Implemented

1. **Meeting Context Incomplete** ✅ FIXED
   - **Problem:** `getMeetingContext()` only returned `meetingID` and `meetingTopic`, missing `meetingUUID` and `participantUUID`
   - **Solution:** Call three separate SDK methods and merge results
   - **Files:** `frontend/src/contexts/ZoomSDKContext.jsx:24-62`

2. **URL Encoding Bug** ✅ FIXED
   - **Problem:** Meeting UUIDs with `+` character decoded as space in GET query parameters, creating duplicate meeting entries
   - **Solution:** Added `encodeURIComponent()` to meeting ID in consent state fetch
   - **Files:** `frontend/src/contexts/ConsentContext.jsx:83`

3. **Webhook vs SDK UUID Mismatch** ✅ FIXED
   - **Problem:** Zoom webhooks use base64 UUIDs while SDK uses standard UUIDs, creating duplicate participant entries
   - **Solution:** Changed participant sync to use SDK as authoritative source, replacing webhook participants
   - **Files:** `backend/src/routes/participants.js:211-252`

4. **New Participants Not Prompted** ✅ FIXED
   - **Problem:** New participants joining mid-meeting weren't prompted to open the app
   - **Solution:** Added automatic app invitation via `sendAppInvitationToAllParticipants` when new participant detected
   - **Files:** `frontend/src/hooks/useParticipantTracking.js:120-143`

5. **Enhanced Error Logging** ✅ IMPLEMENTED
   - Added detailed console logging throughout SDK initialization and API calls
   - Added participant UUID comparison logging for debugging
   - Added fetch response status logging

6. **Webhook Duplicate Participant Creation** ✅ FIXED
   - **Problem:** Webhooks were still adding participants even after switching to SDK-first tracking
   - **Solution:** Disabled webhook participant addition - webhooks now log-only, SDK is sole source of truth
   - **Files:** `backend/src/routes/webhooks.js:126-147, 155-176`

7. **RTMS Webhook Payload Parsing** ✅ FIXED
   - **Problem:** Backend expected nested payload structure (`payload.object.uuid`) but Zoom sends flat structure
   - **Solution:** Updated webhook handler to use correct structure (`payload.meeting_uuid`, `payload.rtms_stream_id`, `payload.server_urls`)
   - **Files:** `backend/src/routes/webhooks.js:180-229`

8. **RTMS Server Webhook Endpoint** ✅ FIXED
   - **Problem:** RTMS server had no `/webhook` endpoint, backend got 404 when forwarding
   - **Solution:** Added Express POST endpoint to receive webhooks and call SDK handlers
   - **Files:** `rtms/sdk/index.js:235-258`

---

## ⚠️ Known Issues & Limitations

### 1. Private Apps Cannot Run in Guest Mode ⚠️ PRODUCTION BLOCKER
**Status:** Architectural limitation of private Zoom Apps

**The Problem:**
- Private (unpublished) Zoom Apps can only be used by users **within your Zoom account**
- External participants (guests from other organizations) **cannot open private apps**
- This breaks unanimous consent for meetings with external guests
- App invitations are sent but external users see nothing

**Impact:**
- ✅ Works perfectly for internal-only meetings (same organization)
- ❌ Cannot achieve unanimous consent with external participants
- ❌ Blocks production deployment for mixed meetings

**Solutions:**
1. **Publish to Zoom Marketplace** (long-term) - Makes app available to all Zoom users
2. **Chat-based consent fallback** (Phase 11 - **BLOCKED by DLP requirement**) - External users type "I consent" in chat
3. **Manual consent tracking** (interim) - Host manually marks participants as consented
4. **Internal-only consent model** (not recommended) - Only require internal participants to consent

**Current Status:** Phase 11 implementation complete but blocked by DLP requirement (see issue #8 below)

### 2. RTMS Webhook URL Configuration
**Status:** Requires manual setup in Zoom Marketplace

**What's Missing:**
- Webhook URL must be configured in Zoom Marketplace to point to your ngrok URL
- Event subscriptions: `meeting.rtms_started`, `meeting.rtms_stopped`
- Actual `zoomSdk.stopRTMS()` SDK call
- RTMS server to capture transcripts
- RTMS webhook event handling

**Impact on Demo:** None - consent workflow fully functional
**Fix Priority:** Phase 4 implementation (when ready for production)

**Files to Update When Implementing:**
```
backend/src/routes/consent.js:52 - Uncomment zoomSdk.startRTMS()
backend/src/routes/participants.js:100 - Uncomment zoomSdk.stopRTMS()
rtms/sdk/index.js - Implement RTMS server
```

### 2. OAuth Not Implemented
**Status:** Routes stubbed, not implemented

**Current Behavior:**
- Routes return placeholder text:
  - `/api/zoomapp/install` → "OAuth Installation - Will be implemented in Phase 6"
  - `/api/zoomapp/auth` → "OAuth Callback - Will be implemented in Phase 6"
  - `/api/zoomapp/authorize` → "PKCE Challenge - Will be implemented in Phase 6"
  - `/api/zoomapp/onauthorized` → "OAuth Token Exchange - Will be implemented in Phase 6"

**Why It's Not Critical for Demo:**
- Guests are anonymous (no auth needed)
- Host features work without authentication
- SDK provides meeting context without OAuth

**When to Implement:**
- Required for production deployment
- Needed to access Zoom REST APIs on behalf of user
- Needed for proper host identification

**Impact on Demo:** None - demo works without OAuth
**Fix Priority:** Phase 6 (production requirement)

### 3. Webpack Deprecation Warnings
**Status:** Harmless, informational only

**Console Output:**
```
DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated
DeprecationWarning: 'onBeforeSetupMiddleware' option is deprecated
```

**Cause:** Create React App's internal webpack config (can't fix without ejecting)

**Impact on Demo:** None - purely cosmetic
**Fix Priority:** Low (will be resolved when CRA updates)

### 4. Mobile Responsive Design
**Status:** Not implemented

**Current State:**
- Works on desktop/laptop
- Not optimized for mobile/tablet

**Impact on Demo:** None if demoing on desktop
**Fix Priority:** Phase 9 (UI polish)

### 5. Participant Reconnection Handling
**Status:** Treated as new join

**Current Behavior:**
- Participant disconnects and reconnects → detected as "new join"
- RTMS will pause (if running)
- Participant needs to consent again

**Expected Behavior:**
- Detect reconnection vs new join
- Preserve previous consent status
- Don't pause RTMS for reconnections

**Impact on Demo:** Minor (only if participant has connection issues)
**Fix Priority:** Medium (Phase 5 edge case)

### 6. /ws WebSocket Errors
**Status:** Harmless log noise

**Console Output:**
```
[HPM] GET /ws -> http://frontend:3000
WebSocket connection to 'wss://mdh.ngrok.dev/ws' failed: Protocol error
```

**Cause:** Unknown source attempting WebSocket connections to `/ws` path (correct path is `/socket.io`)

**Impact on Demo:** None - correct WebSocket path (`/socket.io`) works fine
**Fix Priority:** Low (cosmetic log cleanup)

### 7. Mobile App Invitation Issues
**Status:** Investigation needed - Potential blocker for production

**The Problem:**
- Zoom Apps ARE supported on mobile (iOS, Android)
- However, app invitations may not be reaching mobile participants reliably
- Mobile users might need to manually open the app from the Apps menu
- This creates UX friction and potential consent delays

**Current Behavior:**
1. Mobile participant joins meeting → RTMS pauses (waiting for consent)
2. `sendAppInvitationToAllParticipants()` is called
3. Desktop participants receive invitation notification
4. **Mobile participants may not receive invitation** (investigating why)
5. Mobile user must manually: Apps menu → Find app → Open app → Consent
6. Manual discovery creates UX friction and delays

**Possible Causes (Under Investigation):**
- App invitation API may have different behavior on mobile
- Mobile notification settings may affect invitation delivery
- Zoom mobile app version differences
- App marketplace settings or scopes affecting mobile invitations
- Mobile apps menu visibility/discoverability

**Potential Solutions:**

**Option 1: Chat-Based Consent** (Recommended)
- Mobile participants type consent command in Zoom chat (e.g., "I consent" or "/agree")
- Backend monitors chat messages via Zoom Chat API or webhooks
- Parses consent keywords and updates participant status
- **Pros:** Works on all platforms, simple UX, non-intrusive
- **Cons:** Requires Zoom Chat API scopes, keyword parsing complexity, potential for misinterpretation
- **Implementation:** Phase 11 - Chat consent integration

**Option 2: Voice/Verbal Consent** (Advanced)
- Audio analysis detects participant saying "I consent" or similar phrase
- Requires speech-to-text processing of meeting audio
- **Pros:** Hands-free, natural interaction
- **Cons:** Complex implementation, language barriers, accuracy issues, privacy concerns
- **Implementation:** Requires audio processing service, Phase 12+

**Option 3: External Web Form** (Alternative)
- Send mobile users a link to external consent form (via SMS, email, or Zoom chat)
- Form hosted on public URL, authenticated by meeting ID + participant ID
- **Pros:** Works on any device with browser
- **Cons:** Extra step, context switching, auth complexity, SMS/email infrastructure
- **Implementation:** Separate web app, Phase 11+

**Option 4: Hybrid Approach** (Best for Production)
- Desktop users: Zoom App consent (current implementation)
- Mobile users: Chat-based consent as fallback
- Auto-detect platform and show appropriate consent method
- **Pros:** Best UX for both platforms, graceful degradation
- **Cons:** Dual implementation, more testing needed
- **Implementation:** Phase 11 - Add chat listener to existing flow

**Recommended Next Steps:**
1. Implement chat-based consent as fallback (Phase 11)
2. Update consent prompt to show instructions for mobile users
3. Add platform detection and alternate UX messaging
4. Test with mixed desktop/mobile participants

**Fix Priority:** HIGH (Required for production deployment with mobile users)

### 8. Chat-Based Consent Blocked by DLP Requirement ⚠️ PRODUCTION BLOCKER
**Status:** Implementation complete, **BLOCKED by Zoom account prerequisite**

**The Problem:**
- Implemented Phase 11 (Chat-Based Consent) to handle external participants
- `meeting.chat_message_sent` webhook requires **DLP (Data Loss Prevention) integration**
- DLP must be enabled at Zoom **account level** (not app level)
- Typically enterprise/business feature, requires account admin permissions

**Technical Details:**
- **Webhook:** `meeting.chat_message_sent` - Triggers when in-meeting chat message sent
- **Prerequisite:** "Enable in-meeting chat DLP (Data Loss Prevention) integration"
- **Location:** Zoom Admin Portal → Account Management → Account Settings → Meeting → In Meeting (Advanced)
- **Without DLP:** Zoom does NOT send `meeting.chat_message_sent` webhooks at all

**What Was Implemented:**
1. ✅ Backend webhook handler: `backend/src/routes/webhooks.js:278-390`
2. ✅ Keyword parsing: Detects "I consent", "I agree", "I decline", etc.
3. ✅ Participant matching: By name, email, session ID
4. ✅ Consent submission: Via `ConsentManager.submitConsent()`
5. ✅ Proactive messaging: `sendMessageToChat` sends instructions when participants join
6. ✅ UI updates: ConsentPrompt and ParticipantList show chat keywords

**Testing Results:**
- Added `meeting.chat_message_sent` to Event Subscriptions ✅
- Reinstalled app ✅
- Sent chat messages in meeting ✅
- Backend received: `meeting.participant_joined`, `meeting.rtms_started`, etc. ✅
- Backend received: `meeting.chat_message_sent` ❌ (NOT sent without DLP)
- Zoom Marketplace webhook logs: No `meeting.chat_message_sent` events ❌

**Alternative Solutions:**
1. **Enable DLP** (if account has enterprise plan and admin access)
   - Contact Zoom account admin
   - Enable DLP integration in account settings
   - Webhook will start working immediately

2. **Manual Consent Tracking** (Interim solution)
   - Add button for host to manually mark participants as consented
   - Host sees chat messages, clicks button to update consent
   - **Pros:** Works today, no prerequisites
   - **Cons:** Manual process, requires host action
   - **Time:** ~2 hours to implement

3. **External Web Form**
   - Send link via chat, participants consent via web
   - Authenticate by meeting ID + email
   - **Pros:** Works on any device
   - **Cons:** Context switching, additional infrastructure
   - **Time:** ~4-6 hours to implement

4. **Publish App** (Long-term solution)
   - Publish to Zoom Marketplace
   - Makes app available to all Zoom users
   - External participants can open app
   - **Pros:** Proper solution, no workarounds needed
   - **Cons:** Weeks-long Zoom review process

**Recommended Path Forward:**
- **Short-term:** Implement manual consent tracking OR enable DLP if available
- **Long-term:** Publish app to Zoom Marketplace

**Fix Priority:** HIGH (Blocks external participant consent without DLP or manual tracking)

---

## 🔧 Outstanding Items by Priority

### Priority 1: Demo Blockers (None!)
**Status:** ✅ All demo blockers resolved

The app is fully functional for demonstrating **multi-participant** consent workflow with automatic app invitations.

### Priority 2: Production Requirements

**Phase 4: RTMS Integration** ✅ COMPLETE
- [x] Implement actual `zoomSdk.callZoomApi('startRTMS')` call
- [x] Implement actual `zoomSdk.callZoomApi('stopRTMS')` call
- [x] Set up RTMS server using `@zoom/rtms` SDK v0.0.4
- [x] Test transcript capture in real meeting
- [x] Implement RTMS webhook handlers (backend forwarding + RTMS server reception)
- [x] Fix webhook payload parsing (flat structure vs nested)
- [x] Test full flow: consent → RTMS start → WebSocket connect → transcript capture

**Phase 6: OAuth Authentication**
- [ ] Generate PKCE challenge and verifier
- [ ] Implement `zoomSdk.authorize()` flow
- [ ] Handle `onAuthorized` event
- [ ] Exchange authorization code for tokens
- [ ] Store encrypted tokens in Redis
- [ ] Implement token refresh logic
- [ ] Create Authorization UI component

### Priority 3: Robustness & Edge Cases

**Phase 5: Edge Cases**
- [x] Dynamic RTMS pause/resume on participant join ✅ WORKING
- [x] Automatic app invitations for new participants ✅ WORKING
- [ ] Distinguish reconnection from new join (currently treats as new join)
- [ ] Test rapid join/leave scenarios (5+ participants)
- [ ] Handle simultaneous consent submissions
- [ ] Add retry logic for failed RTMS operations
- [ ] Clean up /ws WebSocket error logs

**Phase 8: Error Handling**
- [ ] User-facing error messages (currently console only)
- [ ] Meeting cleanup on `meeting.ended` webhook
- [ ] Centralized error logging
- [ ] Error reporting API endpoint

### Priority 4: Quality & Polish

**Phase 9: UI/UX**
- [ ] Mobile responsive design
- [ ] Transition animations
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Improved consent prompt copy
- [ ] Tooltips and help text
- [ ] Icons (React Icons or Bootstrap Icons)

**Phase 10: Testing & Documentation**
- [ ] Unit tests for backend logic (Jest configured, no tests written)
- [ ] Integration tests for API endpoints
- [ ] Load test with 50+ participants
- [ ] Security audit
- [ ] User guide for meeting hosts
- [ ] Demo video

---

## 🚀 Quick Start for Testing

### Prerequisites Checklist
- [x] Docker Desktop running
- [x] ngrok installed and configured
- [x] Zoom account with Marketplace app created
- [x] `.env` file with required variables
- [x] **CRITICAL**: Domain allowlist includes `appssdk.zoom.us`
- [x] **CRITICAL**: OAuth redirect URL configured (required before installation)
- [x] **CRITICAL**: RTMS scopes enabled (at minimum: Transcripts)

**⚠️ See `docs-from-claude/07-critical-setup-requirements.md` for detailed setup instructions**

### Start the Application

```bash
# 1. Start ngrok tunnel
ngrok http 3000
# Copy the HTTPS URL (e.g., https://mdh.ngrok.dev)

# 2. Update .env with ngrok URL
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app

# 3. Start Docker services
docker-compose up --build

# 4. Verify services are running
docker-compose ps
# Should show: backend, frontend, redis all "Up"

# 5. Check logs
docker-compose logs -f backend | grep "Server running"
docker-compose logs -f frontend | grep "webpack compiled"

# 6. Update Zoom Marketplace
# - Home URL: https://your-ngrok-url.ngrok-free.app/api/zoomapp/home
# - Redirect URL: https://your-ngrok-url.ngrok-free.app/api/zoomapp/auth

# 7. Reinstall app in Zoom
# - Remove app from Zoom
# - Install again from Marketplace
# - Open app in a Zoom meeting
```

### Testing Consent Workflow

**Single Participant Test:**
1. Join Zoom meeting as host
2. Open the app in meeting
3. You should see host dashboard with your name in participant list
4. Click "I Agree" on consent prompt
5. Check that:
   - ✅ Consent badge turns green
   - ✅ Backend logs show "UNANIMOUS CONSENT ACHIEVED"
   - ✅ RTMS status shows "Transcript Access Active"
   - ✅ "All participants have consented" message displays

**Multi-Participant Test (Automatic Invitation):**
1. Join meeting as host (Participant A)
2. Open app - should see yourself in participant list with "Pending" status
3. Click "I Agree" as host - RTMS starts showing "Transcript Access Active"
4. Join as guest (Participant B) from another browser/device
5. Check on host's screen:
   - ✅ RTMS status changes to "Paused"
   - ✅ Pause reason shows: "New participant joined: [Name]"
   - ✅ Console shows "📨 Sending app invitation to all participants..."
6. Check on guest's Zoom client:
   - ✅ **Guest receives app invitation notification**
   - ✅ Notification has button to open the app
7. Guest clicks the invitation notification (or opens app manually from Apps menu)
8. Guest sees consent prompt and clicks "I Agree"
9. Check that:
   - ✅ Host dashboard shows both participants as "Agreed"
   - ✅ RTMS status changes back to "Transcript Access Active"
   - ✅ WebSocket updates both clients in real-time
   - ✅ Both see "All participants have consented" message

**Three Participant Test (Dynamic Pause/Resume):**
1. Start with 2 participants who have consented (RTMS Active)
2. Third participant joins meeting (RTMS pauses)
3. Check console logs for automatic app invitation
4. Third participant receives invitation and opens app
5. Third participant clicks "I Agree"
6. Check that:
   - ✅ RTMS status changes back to "Active"
   - ✅ All three participants show "Agreed"
   - ✅ Real-time sync across all three clients

### Debugging Checklist

**If app doesn't load:**
- [ ] Check ngrok is running: `curl https://your-ngrok-url.ngrok-free.app/health`
- [ ] Check Docker containers: `docker-compose ps`
- [ ] Check backend logs: `docker-compose logs backend | tail -50`
- [ ] Check frontend logs: `docker-compose logs frontend | tail -50`
- [ ] Verify Home URL in Zoom Marketplace matches ngrok URL

**If WebSocket doesn't connect:**
- [ ] Check browser console for WebSocket errors
- [ ] Verify: "Connecting to WebSocket server at: https://your-ngrok-url.ngrok-dev"
- [ ] Check backend logs for WebSocket connection attempts
- [ ] Restart services: `docker-compose restart backend frontend`

**If Zoom SDK API fails:**
- [ ] Check browser console for: `⚠️ UNSUPPORTED APIs`
- [ ] Review list of missing APIs in console
- [ ] Go to Zoom Marketplace → Features → Add missing APIs
- [ ] Reinstall app in Zoom

**If API returns 400 errors:**
- [ ] Check browser console for validation errors
- [ ] Look for: `❌ Cannot submit consent: missing meetingUUID or participantUUID`
- [ ] Verify meeting context is available: Check console for `✅ Meeting Context:`
- [ ] Restart app if context isn't loading

---

## 📊 Service Status

### Backend (Port 3000)
**Health Check:** `curl http://localhost:3000/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T...",
  "uptime": 123.45
}
```

**Key Logs to Monitor:**
```bash
docker-compose logs -f backend | grep -E "(Server running|CONSENT|PARTICIPANT|RTMS|WebSocket)"
```

### Frontend (Internal, proxied via backend)
**Status Check:** `docker-compose logs frontend | grep "webpack compiled"`

**Expected Output:**
```
webpack compiled successfully
```

**Common Issues:**
- "Invalid Host header" → Fixed by `DANGEROUSLY_DISABLE_HOST_CHECK=true`
- WebSocket connection errors → Fixed by using `window.location.origin`

### Redis (Port 6379)
**Health Check:**
```bash
docker exec -it zoom-consent-redis redis-cli ping
# Expected: PONG
```

**Check Consent State:**
```bash
docker exec -it zoom-consent-redis redis-cli
> KEYS *
> GET consent:[your-meeting-uuid]
```

---

## 🔐 Environment Variables Status

### Required (Currently Set)
- ✅ `ZOOM_APP_CLIENT_ID` - Zoom app client ID
- ✅ `ZOOM_APP_CLIENT_SECRET` - Zoom app secret
- ✅ `ZOOM_APP_REDIRECT_URI` - OAuth redirect (not used yet)
- ✅ `PUBLIC_URL` - ngrok URL
- ✅ `SESSION_SECRET` - Express session secret
- ✅ `REDIS_ENCRYPTION_KEY` - Redis encryption key

### Optional (Not Critical)
- ⚠️ `ZOOM_SECRET_TOKEN` - Webhook signature verification (not set)
  - Current: Skipping signature validation
  - Impact: Webhooks work but aren't verified
  - Priority: Set for production

---

## 📝 Important File Locations

### Configuration
- `.env` - Environment variables (ngrok URL, Zoom credentials)
- `docker-compose.yml` - Multi-container setup
- `backend/src/config.js` - Backend configuration
- `frontend/public/index.html` - Zoom SDK script loader

### Core Implementation
- `frontend/src/App.js` - SDK initialization, host/guest detection
- `frontend/src/contexts/ConsentContext.jsx` - Consent state management
- `frontend/src/contexts/WebSocketContext.jsx` - WebSocket connection
- `backend/src/routes/consent.js` - Consent API endpoints
- `backend/src/routes/participants.js` - Participant tracking endpoints
- `backend/src/services/ConsentManager.js` - Consensus logic
- `backend/src/services/WebSocketServer.js` - WebSocket broadcasting

### Documentation
- `ARCHITECTURE.md` - Full system architecture
- `docs/SETUP.md` - Detailed setup instructions
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `docs/PHASE_STATUS.md` - Implementation status by phase
- `PROJECT_STATUS.md` - This file

---

## 🎬 Demo Script

### Preparation (5 minutes)
1. Start ngrok and Docker services
2. Update Zoom Marketplace with new ngrok URL
3. Have 2-3 Zoom accounts ready
4. Test that app loads in Zoom meeting

### Demo Flow (10 minutes)

**Scene 1: Introduction (2 min)**
- "This app demonstrates consent-based access to meeting transcripts"
- "All participants must explicitly consent before RTMS starts"
- "If someone disagrees, RTMS cannot start"

**Scene 2: Single Participant Consent (3 min)**
- Join as host, open app
- Show host dashboard with participant list
- Click "I Agree" on consent prompt
- Show how unanimous consent is detected
- Show RTMS status changes to "Active"
- Point out: "In production, this would start actual RTMS"

**Scene 3: Multi-Participant Consent (3 min)**
- Have second person join meeting
- Show both participants in host dashboard
- Show second participant consent prompt
- Second participant clicks "I Agree"
- Show real-time WebSocket update on host dashboard
- Show RTMS status remains "Active"

**Scene 4: Dynamic Pause/Resume (2 min)**
- Third participant joins meeting
- Show RTMS status changes to "Paused"
- Show pause reason: "New participant joined: [Name]"
- Third participant consents
- Show RTMS status changes back to "Active"
- Highlight: "This ensures continuous consent from all participants"

**Scene 5: Disagreement Scenario (Optional)**
- Participant clicks "I Disagree"
- Show RTMS cannot start
- Show consent status badge turns red
- Explain: "RTMS requires unanimous consent"

---

## 🐛 Troubleshooting Reference

### Issue: "Invalid Host header"
**Cause:** Webpack dev server rejecting ngrok Host header
**Fix:** Already applied - `DANGEROUSLY_DISABLE_HOST_CHECK=true` in docker-compose.yml
**Verify:** `docker exec zoom-consent-frontend env | grep DANGEROUSLY`

### Issue: WebSocket connection fails
**Cause:** Frontend trying to connect to localhost instead of ngrok
**Fix:** Already applied - Using `window.location.origin` in WebSocketContext.jsx
**Verify:** Check browser console for "Connecting to WebSocket server at: https://..."

### Issue: 400 errors on API calls
**Cause:** API called before meetingContext is available
**Fix:** Already applied - Validation checks in hooks and contexts
**Verify:** Check console for validation warnings before API calls

### Issue: "API not supported" errors
**Cause:** SDK API not enabled in Zoom Marketplace
**Fix:**
1. Check browser console for `⚠️ UNSUPPORTED APIs` list
2. Go to Zoom Marketplace → Your App → Features → Add APIs
3. Enable missing APIs
4. Reinstall app in Zoom

### Issue: Changes not reflecting
**Frontend changes:**
```bash
docker-compose restart frontend
# Hot reload should work automatically
```

**Backend changes:**
```bash
docker-compose restart backend
# Nodemon should auto-restart
```

**docker-compose.yml changes:**
```bash
docker-compose down
docker-compose up --build
```

---

## 📈 Next Development Phases

### Current State: ✅ Demo Ready
**The app is fully functional for multi-participant consent workflow demonstrations.**

All Phase 1-3 features are complete and tested. Phase 5 dynamic pause/resume is working with automatic app invitations.

### For Production Deployment

**Phase 4: Actual RTMS Integration** (Required for Production)
- **Current:** RTMS state transitions work, but SDK calls are stubbed
- **Needed:**
  1. Uncomment `zoomSdk.startRTMS()` and `stopRTMS()` calls in backend
  2. Implement RTMS server using `@zoom/rtms` SDK
  3. Configure RTMS webhook handlers for transcript events
  4. Test actual transcript capture in real meeting
  5. Verify RTMS start/stop/pause/resume with real API calls
- **Files to update:**
  - `backend/src/routes/consent.js:52` - Uncomment startRTMS()
  - `backend/src/routes/participants.js:100` - Uncomment stopRTMS()
  - `rtms/sdk/index.js` - Implement RTMS server
  - `backend/src/routes/webhooks.js` - Add RTMS event handlers

**Phase 6: OAuth Authentication** (Required for Production)
- **Current:** OAuth routes stubbed, redirect URL configured
- **Needed:**
  1. Implement PKCE OAuth flow (code challenge/verifier generation)
  2. Call `zoomSdk.authorize()` with PKCE parameters
  3. Handle `onAuthorized` event and exchange code for tokens
  4. Store encrypted tokens in Redis with refresh logic
  5. Create Authorization UI component for host login
  6. Protect host-only routes and features
- **Impact:** Required for accessing Zoom REST APIs on behalf of user

**Phase 8: Error Handling & UX** (Recommended)
- **Current:** Console logging only, no user-facing error messages
- **Needed:**
  1. Add error alert components to show API failures to users
  2. Implement meeting cleanup on `meeting.ended` webhook
  3. Add retry logic for transient failures
  4. Implement reconnection detection vs new join
  5. Add error reporting API endpoint
  6. Clean up /ws WebSocket error logs

**Phase 9: UI Polish** (Optional)
- **Current:** Basic Bootstrap styling, desktop-only
- **Needed:**
  1. Mobile responsive design (media queries, flex layouts)
  2. Accessibility improvements (ARIA labels, keyboard navigation)
  3. Transition animations for state changes
  4. Improved consent prompt copy and UX
  5. Loading states and skeleton screens

**Phase 10: Testing & Documentation** (Recommended)
- **Current:** Manual testing, docs updated
- **Needed:**
  1. Unit tests for backend services
  2. Integration tests for API endpoints
  3. Load test with 50+ participants
  4. Security audit (OAuth, token storage)
  5. End-user guide for meeting hosts
  6. Demo video walkthrough

**Phase 11: Chat-Based Consent** ⚠️ **BLOCKED by DLP Requirement**
- **Purpose:** Enable consent for external participants who cannot open private Zoom Apps
- **Status:** Implementation complete, **BLOCKED by Zoom DLP prerequisite**
- **Implemented Features:**
  1. ✅ Backend webhook handler for `meeting.chat_message_sent`
  2. ✅ Keyword parsing for consent detection ("I consent", "I agree", "I decline", etc.)
  3. ✅ Participant matching by sender name, email, and session ID
  4. ✅ Consent submission via `ConsentManager` on behalf of chat sender
  5. ✅ Proactive chat messaging via `sendMessageToChat` when participants join
  6. ✅ ConsentPrompt UI updated with chat instructions
  7. ✅ ParticipantList shows chat keywords when participants pending
- **Critical Blocker - DLP Requirement:**
  - **Prerequisite:** Zoom account must have **DLP (Data Loss Prevention) integration** enabled
  - **Location:** Zoom Admin Portal → Account Settings → Meeting → In Meeting (Advanced)
  - **Setting:** "Enable in-meeting chat DLP (Data Loss Prevention) integration"
  - **Limitation:** Typically enterprise/business feature, requires account admin permissions
  - **Impact:** Without DLP, `meeting.chat_message_sent` webhooks are NOT sent by Zoom
- **What Was Implemented:**
  - Backend: `backend/src/routes/webhooks.js:278-390` - Chat webhook handler and keyword parser
  - Frontend: `frontend/src/contexts/ZoomSDKContext.jsx:125-136` - `sendChatMessage` helper
  - Frontend: `frontend/src/hooks/useParticipantTracking.js:144-155` - Proactive chat messaging
  - UI: `frontend/src/components/ConsentPrompt.jsx:94-100` - Chat instructions
  - UI: `frontend/src/components/ParticipantList.jsx:41-53` - Pending participant instructions
- **Alternative Solutions:**
  1. **Enable DLP** (if account has enterprise features and admin access)
  2. **Manual consent tracking** - Host button to mark participants as consented based on chat
  3. **External web form** - Send link via chat, participants consent via web
  4. **Publish app** (long-term) - Make app public so external participants can open it
- **Impact:** HIGH - Would enable consent for external participants, but blocked by Zoom account requirement
- **Next Steps:** Implement manual consent tracking as interim solution OR enable DLP if available

---

## 📞 Quick Commands Reference

```bash
# Start everything
docker-compose up --build

# Stop everything
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service status
docker-compose ps

# Enter Redis CLI
docker exec -it zoom-consent-redis redis-cli

# Check backend health
curl http://localhost:3000/health

# Rebuild after package.json changes
docker-compose down
docker-compose up --build

# Clean everything (nuclear option)
docker-compose down -v
docker system prune -a
docker-compose up --build
```

---

**Demo State Summary:** ✅ **FULLY FUNCTIONAL** - Multi-participant consent workflow with automatic app invitations
**Production State:** ⚠️ Requires Phase 4 (Actual RTMS) and Phase 6 (OAuth)
**Blockers:** None for demo purposes
**Multi-Participant Testing:** ✅ Tested and working
**Last Verified:** 2025-11-24

## 📊 Phase Completion Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ 100% | Complete - SDK, Docker, WebSocket all working |
| Phase 2: Consent UI | ✅ 100% | Complete - Full consent workflow implemented |
| Phase 3: Participant Tracking | ✅ 100% | Complete - SDK-first with webhook backup, UUID reconciliation |
| Phase 4: RTMS Integration | ✅ 100% | **COMPLETE** - Real transcript capture working, WebSocket connected |
| Phase 5: Dynamic Pause/Resume | ✅ 100% | Complete - Multi-participant tested, app invitations working |
| Phase 6: OAuth | ❌ 5% | Redirect URL configured, implementation pending |
| Phase 7: State Sync | ✅ 95% | WebSocket working, minor optimizations possible |
| Phase 8: Error Handling | ⚠️ 60% | Enhanced logging added, user-facing errors needed |
| Phase 9: UI Polish | ⚠️ 50% | Basic Bootstrap UI, responsive design pending |
| Phase 10: Testing & Docs | ⚠️ 65% | Docs updated with Phase 4, automated tests pending |
| Phase 11: Chat-Based Consent | ⚠️ 90% | **BLOCKED** - Implementation complete, blocked by DLP requirement |

**Overall Progress:** 80% complete for production deployment (core features)
**Demo Readiness:** 100% ✅ (internal participants + RTMS working)
**Production Blockers:** Phase 6 (OAuth), Phase 11 (DLP requirement OR manual tracking alternative), Issue #1 (Private app limitation)
**Production Improvements:** Manual consent tracking (Phase 11 alternative)
