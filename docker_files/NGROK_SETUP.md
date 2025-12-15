# ngrok Setup Guide

Your ngrok URL: **https://6e085140c61d.ngrok-free.app**

## Which URLs to Update with ngrok

### ✅ UPDATE These (External Access)

URLs that **Zoom servers** need to reach:

```bash
# .env file
PUBLIC_URL=https://6e085140c61d.ngrok-free.app
ZOOM_REDIRECT_URL=https://6e085140c61d.ngrok-free.app/api/auth/callback
```

### ❌ KEEP AS LOCALHOST (Internal Communication)

URLs for **local services** to talk to each other:

```bash
# .env file - DO NOT CHANGE THESE
FRONTEND_URL=http://localhost:3000
RTMS_SERVER_URL=http://localhost:3002
REACT_APP_BACKEND_URL=http://localhost:3001
```

## Why This Configuration?

### External (ngrok) URLs

**PUBLIC_URL** - Zoom webhooks
- Zoom servers need to send webhooks to your backend
- Must be publicly accessible via ngrok
- Example: `https://6e085140c61d.ngrok-free.app/api/webhooks/zoom`

**ZOOM_REDIRECT_URL** - OAuth callback
- After OAuth, Zoom redirects user to this URL
- Must match exactly what's in Marketplace settings
- Example: `https://6e085140c61d.ngrok-free.app/api/auth/callback`

### Internal (localhost) URLs

**FRONTEND_URL** - Browser to backend
- Your browser can reach localhost directly
- No need for ngrok
- Faster and more reliable

**RTMS_SERVER_URL** - Backend to RTMS
- Both run on same machine
- Internal communication via localhost
- Never exposed to internet

**REACT_APP_BACKEND_URL** - React app to backend
- Frontend JavaScript makes API calls to backend
- Both run locally during development
- Browser connects to localhost:3001 directly

## Your Configuration

### Current .env Settings

```bash
# ✅ External (ngrok)
PUBLIC_URL=https://6e085140c61d.ngrok-free.app
ZOOM_REDIRECT_URL=https://6e085140c61d.ngrok-free.app/api/auth/callback

# ❌ Internal (localhost)
FRONTEND_URL=http://localhost:3000
RTMS_SERVER_URL=http://localhost:3002
REACT_APP_BACKEND_URL=http://localhost:3001
```

## Update Zoom Marketplace

Go to your [Zoom Marketplace](https://marketplace.zoom.us/) app and update:

### 1. OAuth Redirect URL

**Location**: App Credentials → OAuth Redirect URL

**Value**:
```
https://6e085140c61d.ngrok-free.app/api/auth/callback
```

### 2. Event Notification Endpoint URL

**Location**: Features → Event Subscriptions → Event notification endpoint URL

**Value**:
```
https://6e085140c61d.ngrok-free.app/api/webhooks/zoom
```

**Subscribe to**:
- ✅ `meeting.rtms_started`
- ✅ `meeting.rtms_stopped`

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Zoom Cloud Servers                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Webhooks & OAuth
                              │ (needs public URL)
                              ▼
                    ┌─────────────────────┐
                    │       ngrok         │
                    │  6e085140c61d...    │
                    └─────────────────────┘
                              │
                              │ Tunnel to localhost:3001
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Your Local Machine                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │   Frontend   │◄───┤   Backend    │◄───┤  RTMS Server ││
│  │ localhost:   │    │ localhost:   │    │ localhost:   ││
│  │    3000      │    │    3001      │    │    3002      ││
│  └──────────────┘    └──────────────┘    └──────────────┘│
│        ▲                                                   │
│        │ Browser connects directly to localhost           │
│        │                                                   │
└────────┼───────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    │ Browser │
    └─────────┘
```

## Testing Your Setup

### 1. Verify ngrok is running

```bash
# Start ngrok
npm run ngrok

# Or manually
ngrok http 3001

# You should see:
# Forwarding: https://6e085140c61d.ngrok-free.app -> http://localhost:3001
```

### 2. Test webhook endpoint

```bash
# From another terminal
curl https://6e085140c61d.ngrok-free.app/api/webhooks/zoom \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"event":"endpoint.url_validation","payload":{"plainToken":"test"}}'

# Should return encrypted token
```

### 3. Test backend health

```bash
curl https://6e085140c61d.ngrok-free.app/health

# Should return: {"status":"ok",...}
```

### 4. Start services

```bash
npm run dev

# You should see:
# [FRONTEND] Compiled successfully!
# [BACKEND]  Backend server running on port 3001
# [RTMS]     ZCC RTMS Server running on port 3002
```

### 5. Test in browser

Open: http://localhost:3000

You should see the app load successfully.

## Troubleshooting

### "Webhook not received"

**Problem**: Zoom can't reach your webhook endpoint

**Check**:
```bash
# 1. Is ngrok running?
curl https://6e085140c61d.ngrok-free.app/health

# 2. Is backend running?
curl http://localhost:3001/health

# 3. Check Marketplace webhook URL matches exactly
```

### "OAuth redirect fails"

**Problem**: After OAuth, redirect doesn't work

**Check**:
```bash
# 1. Verify ZOOM_REDIRECT_URL in .env
grep ZOOM_REDIRECT_URL .env

# Should be:
# ZOOM_REDIRECT_URL=https://6e085140c61d.ngrok-free.app/api/auth/callback

# 2. Verify Marketplace OAuth Redirect URL matches exactly
```

### "Frontend can't connect to backend"

**Problem**: API calls fail from React app

**Check**:
```bash
# 1. Verify REACT_APP_BACKEND_URL is localhost (not ngrok)
grep REACT_APP_BACKEND_URL .env

# Should be:
# REACT_APP_BACKEND_URL=http://localhost:3001

# 2. Restart frontend after .env changes
npm run dev
```

### "RTMS server not reachable"

**Problem**: Backend can't connect to RTMS

**Check**:
```bash
# 1. Verify RTMS_SERVER_URL is localhost (not ngrok)
grep RTMS_SERVER_URL .env

# Should be:
# RTMS_SERVER_URL=http://localhost:3002

# 2. Check RTMS is running
curl http://localhost:3002/health
```

## ngrok URL Changed?

If your ngrok URL changes (happens on free tier), update:

### 1. Update .env

```bash
# Edit .env file
PUBLIC_URL=https://NEW_URL.ngrok-free.app
ZOOM_REDIRECT_URL=https://NEW_URL.ngrok-free.app/api/auth/callback
```

### 2. Update Zoom Marketplace

- OAuth Redirect URL: `https://NEW_URL.ngrok-free.app/api/auth/callback`
- Webhook URL: `https://NEW_URL.ngrok-free.app/api/webhooks/zoom`

### 3. Restart services

```bash
# Stop (Ctrl+C) and restart
npm run dev
```

## Production Deployment

For production, replace ngrok with your actual domain:

```bash
PUBLIC_URL=https://your-domain.com
ZOOM_REDIRECT_URL=https://your-domain.com/api/auth/callback
FRONTEND_URL=https://your-domain.com
RTMS_SERVER_URL=http://rtms-server:3002  # Internal Docker network
REACT_APP_BACKEND_URL=https://your-domain.com
```

## Quick Reference

| URL | Use ngrok? | Example |
|-----|-----------|---------|
| PUBLIC_URL | ✅ Yes | https://6e085140c61d.ngrok-free.app |
| ZOOM_REDIRECT_URL | ✅ Yes | https://6e085140c61d.ngrok-free.app/api/auth/callback |
| FRONTEND_URL | ❌ No | http://localhost:3000 |
| RTMS_SERVER_URL | ❌ No | http://localhost:3002 |
| REACT_APP_BACKEND_URL | ❌ No | http://localhost:3001 |

---

**Your ngrok tunnel**: https://6e085140c61d.ngrok-free.app

**Webhook endpoint**: https://6e085140c61d.ngrok-free.app/api/webhooks/zoom

**OAuth callback**: https://6e085140c61d.ngrok-free.app/api/auth/callback
