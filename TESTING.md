# GYMINI Admin — Role Testing Checklist

## Setup
You need three accounts in MongoDB:
- admin@test.com → role: "admin"
- mod@test.com → role: "moderator"
- user@test.com → role: "user"

Create via the app's register endpoint, then promote in Atlas UI:
Cluster0 → Browse Collections → gymini → users → edit doc → set role.

---

## Test 1 — Admin can do everything
Log in as admin@test.com:
- [ ] Dashboard loads with stat cards
- [ ] Recent Users table shows recent users
- [ ] Users page loads all users
- [ ] Role dropdown visible on other users (NOT on your own row)
- [ ] Change another user's role works
- [ ] Delete button visible on other users
- [ ] Delete a test user -> row disappears

---

## Test 2 — Moderator is read-only
Log in as mod@test.com:
- [ ] Login succeeds, dashboard loads
- [ ] Users page loads
- [ ] Role dropdown NOT visible (static role badge shown instead)
- [ ] Delete button NOT visible
- [ ] Direct API test blocked (see curl below)

Backend RBAC test from a terminal:
curl -X PUT https://gymini-production-c2e5.up.railway.app/api/admin/users/SOME_ID/role -H "Authorization: Bearer MOD_TOKEN" -H "Content-Type: application/json" -d "{\"role\":\"admin\"}"
Expected: {"message":"Forbidden: requires role admin","yourRole":"moderator"}

---

## Test 3 — User cannot access admin
Log in as user@test.com on the admin web app:
- [ ] Login form shows "Access denied. This dashboard is for administrators only."
- [ ] Token NOT stored in localStorage
- [ ] You remain on /login

---

## Test 4 — Role demotion kicks session
1. Log in as mod@test.com
2. From the admin account, change that moderator's role -> user
3. In the mod tab, reload the page
- [ ] Kicked to /login, session cleared

Reason: AuthContext re-checks role via /auth/me on restore.

---

## Test 5 — Token auto-refresh
Access token TTL = 15 minutes.
1. Log in
2. Open DevTools -> Network
3. Wait 16 minutes (or temporarily set ACCESS_TOKEN_TTL=1m in Railway)
4. Click Users
- [ ] You see POST /auth/refresh in Network
- [ ] The /admin/users call succeeds right after
- [ ] You are NOT logged out

---

## Test 6 — Refresh revocation on logout
1. Log in, note admin_refresh_token in DevTools -> Application -> Local Storage
2. Log out
- [ ] admin_refresh_token cleared
- [ ] Railway logs show [logout] refresh token revoked
- [ ] Old refresh token rejected by /api/auth/refresh -> 401

---

## Test 7 — CORS lockdown
From the deployed Vercel admin console:
- [ ] No CORS errors during login
- [ ] fetch('https://gymini-production-c2e5.up.railway.app/api/auth/me') from a random origin (e.g. codepen.io console) -> CORS-blocked in browser

---

## Test 8 — Deleted user cannot log in
1. Delete a test user via admin
2. Try logging in as them on the mobile app
- [ ] Login fails (user not found)

---

## Regression — mobile unaffected
- [ ] Regular user logs in on mobile
- [ ] Onboarding works
- [ ] Plans / workouts / history / stats load
- [ ] No new errors in Railway logs