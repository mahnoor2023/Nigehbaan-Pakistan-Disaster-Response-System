# Nigehbaan — National Advanced Edition

## What is included
- Existing Command Center, Households, Rescue Missions, Shelter Desk, Field App, Analytics, and Pakistan Coverage screens preserved.
- NEW `/intelligence`: distinctive mission-control dashboard with a public live Open-Meteo API integration for **13 Pakistani city reference points**; current weather and five-day rainfall forecasts, no API key required.
- Data-integrity labels distinguishing dynamic public weather from prototype households, shelter capacities and browser-local missions.
- Responsive layout, loading/error states and no fake weather fallbacks.

## What is NOT included
This is **not** 80% verified national rescue data. No verified household survey, real dispatch backend, public emergency alert authority, or official flood inundation feed is provided. Forecast rainfall is not a flood alert. The pre-existing household/shelter dataset is a demonstration dataset. The rescue tracker is browser-local, not synchronized across devices. Do not use this prototype for actual emergency dispatch.

## GitHub / Vercel
1. Back up the existing repository.
2. Extract this ZIP and upload the **contents** to the repository root, retaining the folder hierarchy. Do not upload the ZIP as one file.
3. Vercel should deploy the connected branch automatically.
4. Check `/intelligence`, `/coverage`, `/command`, `/missions`, `/field`, `/shelter`.
5. If live weather does not load, check browser network access to `api.open-meteo.com`; the interface will show an explicit error.

## Local verification
`npm ci` then `npm run build`

## Data sources and limitations
- Open-Meteo forecast API: https://open-meteo.com/en/docs (check license/attribution and noncommercial vs commercial use terms before production).
- Selected city latitude/longitude reference points are approximate; not official district boundaries.
- Local prototype JSON records from the previous project are retained without claims of field verification.

## Production path
Add Supabase/PostgreSQL, RLS and server-side authorization, verified incident feeds, official geographic boundaries, role-based access, real field verification, offline conflict handling, audit logs, alert approvals, operational validation, and security testing.
