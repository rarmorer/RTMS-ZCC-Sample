# Phase 2 Testing Guide

Complete testing checklist for Phase 2 (Consent UI & State Management).

## Prerequisites

- Phase 1 complete and validated
- Docker environment running (`docker-compose up`)
- Zoom Desktop Client installed
- App configured in Zoom Marketplace

---

## Test 1: Single Participant Consent (Solo)

### Setup
1. Start a test meeting (you can be the only participant)
2. Open your app in the meeting

### Expected Console Output (Frontend)

```
Initializing Zoom Apps SDK...
SDK Configuration Response: {...}
Running Context: inMeeting
User Context: {...}
Meeting Context: {...}
Is Host: true
WebSocket connected
📡 Joining WebSocket room for meeting: [meetingUUID]

🔄 SYNCING INITIAL PARTICIPANTS
Participants to sync: 1
✅ Initial participant sync complete
   Synced: 1 participants

📥 Initial consent state fetched: {
  participants: [{ screenName: "You", consentStatus: "pending" }],
  rtmsStatus: "stopped",
  unanimousConsent: false
}
```

### Expected Backend Output

```
============================================================
🔄 INITIAL PARTICIPANT SYNC
============================================================
Meeting: [meetingUUID]
Participants to sync: 1
============================================================

  ➕ Adding: [Your Name]
📡 Broadcasting initial state to all clients
✅ Sync complete
   Synced: 1
   Already tracked: 0
   Total participants: 1
```

### Test Actions

#### Action 1: Click "I Agree"

**Frontend Should Show:**
- Loading spinner on button
- Button disabled during submission
- Success confirmation message
- "Consent Given" badge appears

**Backend Console:**
```
============================================================
✋ CONSENT SUBMISSION
============================================================
Meeting: [meetingUUID]
Participant: [Your Name]
Consent: AGREED
============================================================

📊 Consent State After Submission:
   Total Participants: 1
   Agreed: 1
   Disagreed: 0
   Pending: 0
   Unanimous Consent: true

🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
🚀 UNANIMOUS CONSENT ACHIEVED - STARTING RTMS!
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉

✅ Would call startRTMS() here (Phase 4)
📡 Broadcasting consent update to all clients
```

**UI Should Show:**
- "Transcript Access Active" alert (green)
- RTMS Status: Running
- Participant list shows "Agreed" badge

✅ **PASS CRITERIA:**
- [x] Consent submitted successfully
- [x] Backend logs show unanimous consent achieved
- [x] RTMS status changes to "running"
- [x] UI updates in real-time
- [x] No errors in console

---

## Test 2: Two Participants (Requires Second User)

### Setup
1. Start a meeting
2. Invite another user to join
3. Both open the app

### User 1 (Host) Actions

#### Action 1: Click "I Agree" (First)

**Expected:**
- Consent recorded as "agreed"
- RTMS status remains "stopped"
- Backend shows: "Waiting for 1 more participant(s) to consent"

**Backend Console:**
```
📊 Consent State After Submission:
   Total Participants: 2
   Agreed: 1
   Disagreed: 0
   Pending: 1
   Unanimous Consent: false

⏳ Waiting for 1 more participant(s) to consent:
   - [User 2 Name]
```

**UI Should Show:**
- Your consent: "Agreed"
- Participant list shows:
  - User 1: Green "Agreed" badge
  - User 2: Yellow "Pending" badge
- RTMS Status: "Stopped"
- Message: "Waiting for consent"

#### Action 2: Watch User 2 Consent

**When User 2 clicks "I Agree":**

**User 1 Should See (via WebSocket):**
```
📩 Consent state update received via WebSocket
📩 RTMS status change received: running
```

**UI Updates:**
- Participant list User 2 badge → Green "Agreed"
- RTMS Status → "Active" (green)
- Alert appears: "Transcript Access Active"

✅ **PASS CRITERIA:**
- [x] First consent doesn't start RTMS
- [x] Second consent triggers unanimous → RTMS starts
- [x] Both users see same state via WebSocket
- [x] No duplicate consent submissions
- [x] Real-time updates work

---

## Test 3: Consent Disagreement

### Setup
1. Start meeting with 2 participants
2. Both open app

### Test Actions

#### Action 1: User 1 Clicks "I Agree"
- Consent recorded
- RTMS remains stopped
- Waiting for User 2

#### Action 2: User 2 Clicks "I Decline"

**Backend Console:**
```
============================================================
✋ CONSENT SUBMISSION
============================================================
Consent: DISAGREED
============================================================

❌ CONSENT DECLINED - RTMS CANNOT START
```

**Both Users Should See:**
- User 1: Green "Agreed"
- User 2: Red "Declined"
- RTMS Status: "Stopped"
- Message: "Participant declined consent"

✅ **PASS CRITERIA:**
- [x] Disagreement prevents RTMS from starting
- [x] RTMS stays stopped even if others agree
- [x] Clear visual indication of disagreement
- [x] Host can see who declined

---

## Test 4: New Participant Joins Mid-Meeting

### Setup
1. Start meeting with 1 participant
2. User 1 consents → RTMS starts
3. User 2 joins the meeting

### Expected Flow

#### When User 2 Joins:

**Backend Console:**
```
============================================================
🔔 PARTICIPANT JOINED (SDK Detection)
============================================================
Meeting: [meetingUUID]
Participant: [User 2 Name]
Detection Method: Zoom Apps SDK (Primary)
============================================================

⚠️  RTMS IS RUNNING - MUST PAUSE FOR NEW PARTICIPANT
🛑 Would call stopRTMS() here (Phase 4)
📡 Broadcasting state update to all clients
✅ Participant join processed successfully
   Total participants: 2
   RTMS Status: paused
   Unanimous Consent: false
```

**All Users Should See:**
- Participant list updated with User 2 (Pending)
- RTMS Status → "Paused"
- Alert: "New participant joined: [User 2 Name]"

#### When User 2 Consents:

**Backend:**
```
🎉🎉 UNANIMOUS CONSENT ACHIEVED - STARTING RTMS!
```

**All Users Should See:**
- RTMS Status → "Running"
- Alert: "Transcript Access Active"

✅ **PASS CRITERIA:**
- [x] Participant join detected within 2 seconds
- [x] RTMS pauses immediately
- [x] New participant sees consent prompt
- [x] RTMS resumes after new consent
- [x] All clients see real-time updates

---

## Test 5: WebSocket Reconnection

### Setup
1. Start meeting with app open
2. Submit consent

### Test Actions

#### Action 1: Disconnect Network
- Turn off WiFi for 5 seconds
- Turn WiFi back on

**Expected:**
```
WebSocket disconnected
WebSocket connected
📡 Joining WebSocket room for meeting: [meetingUUID]
📥 Initial consent state fetched: {...}
```

**UI Should:**
- Show "Connecting to server..." warning during disconnect
- Restore state automatically on reconnect
- Consent status persists (loaded from backend)

✅ **PASS CRITERIA:**
- [x] Graceful disconnect handling
- [x] Automatic reconnection
- [x] State restored from backend
- [x] No duplicate submissions

---

## Test 6: Redis Persistence

### Test Actions

#### Action 1: Submit Consent
- Click "I Agree"
- Verify consent saved

#### Action 2: Check Redis
```bash
docker exec -it zoom-consent-redis redis-cli

> KEYS consent:*
1) "consent:[meetingUUID]"

> GET consent:[meetingUUID]
{
  "meetingId": "...",
  "participants": [
    {
      "participantUUID": "...",
      "screenName": "...",
      "consentStatus": "agreed",
      "consentedAt": "2025-11-23T..."
    }
  ],
  "rtmsStatus": "running",
  "unanimousConsent": true,
  "updatedAt": "..."
}
```

#### Action 3: Restart Backend
```bash
docker-compose restart backend
```

#### Action 4: Refresh App
- App should load previous consent state
- RTMS status preserved
- Participant consents preserved

✅ **PASS CRITERIA:**
- [x] Consent persists in Redis
- [x] State survives backend restart
- [x] 24-hour TTL set on Redis keys
- [x] Correct data structure

---

## Test 7: Multiple Concurrent Users

### Setup
1. Start meeting with 3+ participants
2. All open app simultaneously

### Test Actions

#### Action 1: All Users Consent at Same Time
- User 1, 2, 3 click "I Agree" within 1 second

**Backend Should:**
- Process all consents correctly
- No race conditions
- Detect unanimous consent only once
- Start RTMS once

**Check Backend Logs:**
```bash
docker-compose logs backend | grep "CONSENT SUBMISSION"
```

Should see 3 submissions, last one triggers RTMS.

✅ **PASS CRITERIA:**
- [x] No duplicate RTMS starts
- [x] All consents recorded correctly
- [x] WebSocket broadcasts to all clients
- [x] No errors or race conditions

---

## Test 8: Participant Leaves

### Setup
1. Start meeting with 2 participants
2. Both consent → RTMS running
3. User 2 leaves meeting

### Expected Flow

**Backend Console:**
```
============================================================
📤 PARTICIPANT LEFT (SDK Detection)
============================================================
Participant UUID: [User 2 UUID]
============================================================

✅ Participant leave processed successfully
   Total participants: 1
   RTMS Status: running
   Unanimous Consent: true
```

**User 1 Should See:**
- Participant list updated (User 2 removed)
- RTMS continues running (unanimous among remaining)
- Total count: 1 participant

✅ **PASS CRITERIA:**
- [x] Leave detected within 2 seconds
- [x] Participant removed from state
- [x] RTMS continues if remaining have consented
- [x] UI updates in real-time

---

## Debugging Commands

### View Backend Logs
```bash
docker-compose logs -f backend
```

### View Frontend Logs
- Open DevTools in Zoom Client (Right-click → Inspect)
- Check Console tab

### Check Redis State
```bash
docker exec -it zoom-consent-redis redis-cli

> KEYS *
> GET consent:[meetingUUID]
> MONITOR  # Watch all Redis commands
```

### Check WebSocket Connections
```bash
docker-compose logs backend | grep "WebSocket"
```

### Test API Endpoints Manually
```bash
# Health check
curl http://localhost:3000/health

# Get consent status
curl "http://localhost:3000/api/consent/status?meetingId=test-meeting"

# Submit test consent
curl -X POST http://localhost:3000/api/consent/submit \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "test-meeting",
    "participantId": "test-user-123",
    "participantName": "Test User",
    "consentStatus": "agreed"
  }'
```

---

## Success Criteria Summary

Phase 2 is complete when ALL of the following work:

- [x] Guest sees consent prompt and can click buttons
- [x] Host sees consent prompt
- [x] Consent persists in Redis
- [x] Backend logs show consent saved
- [x] UI shows confirmation after consent
- [x] WebSocket broadcasts updates to all clients
- [x] Unanimous consent triggers RTMS start (simulated)
- [x] Participant joins detected and state updated
- [x] Initial participant sync works on app load
- [x] Multiple users see synchronized state
- [x] Network reconnection handled gracefully
- [x] No errors in browser or backend console
- [x] Redis contains correct consent state

---

## Common Issues

### Issue: WebSocket Not Connecting
**Check:**
```bash
# Backend running?
curl http://localhost:3000/health

# Check CORS settings
docker-compose logs backend | grep CORS
```

### Issue: Consent Not Saving
**Check:**
```bash
# Redis running?
docker ps | grep redis

# Check Redis logs
docker-compose logs redis
```

### Issue: State Not Syncing Between Clients
**Check:**
```bash
# WebSocket room joined?
docker-compose logs backend | grep "Joining WebSocket room"

# Check broadcasts
docker-compose logs backend | grep "Broadcasting"
```

---

**Phase 2 Testing Complete!** ✅

Once all tests pass, you're ready for **Phase 3: Real-time Participant Tracking** (already partially implemented).
