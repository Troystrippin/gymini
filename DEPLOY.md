# GYMINI — Deploy Guide

## Current state

- Backend: deployed at https://gymini-production-c2e5.up.railway.app
- Mobile: deployed via Expo EAS
- Admin: local only — deploying now

## Architecture

## Cloudinary image storage

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` in the backend environment (including Railway). For
local development, use `backend/.env`; `backend/.env.example` lists the keys.

## Admin Google sign-in

Set `VITE_GOOGLE_CLIENT_ID` in the admin build environment to the Google OAuth
web client ID, and set the same value as `GOOGLE_WEB_CLIENT_ID` in the backend
environment. Add the deployed admin origin to the OAuth client's authorized
JavaScript origins and to the backend `ALLOWED_ORIGINS`. For local development,
use `http://localhost:5173` as the authorized JavaScript origin and copy
`admin/.env.example` to `admin/.env.local`.
