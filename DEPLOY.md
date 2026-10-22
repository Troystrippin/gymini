# GYMINI — Deploy Guide

## Current state

- Backend: deployed at https://gymini.onrender.com
- Mobile: deployed via Expo EAS
- Admin: local only — deploying now

## Architecture

## Cloudinary image storage

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` in the backend environment (including Render). For
local development, use `backend/.env`; `backend/.env.example` lists the keys.
