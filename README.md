# Nigehbaan — Pakistan Disaster Response System

Nigehbaan is a hackathon demonstration of explainable flood-response prioritization. It lets a user explore district conditions, adjust a flood scenario, review ranked household needs, inspect suggested resource allocations, create local rescue missions, and manage simulated shelter occupancy.

## Demo workflow

Choose one of Karachi's seven districts, review the Overview and Coverage pages, then use Command Center to adjust the scenario and inspect priority explanations and dispatch recommendations. Create a mission from a household, advance its simulated status, and review the Missions and Shelter pages. The district selector isolates each district's demonstration state.

## Features and routes

- Overview: selected-district indicators and model-based weather context.
- Coverage: Karachi district navigation and available sourced geographic points.
- Command: flood scenario controls, household priorities and dispatch recommendations.
- Households: searchable and filterable district scenario records.
- Missions: browser-local mission creation and valid simulated status transitions.
- Shelters: candidate facilities or synthetic sites with manually managed demo occupancy.
- Field, Analytics and About: supporting workflows, comparisons and methodology.

Suggested dispatch is a recommendation. Creating or completing a mission does not send a real responder or automatically record a shelter arrival.

## Technology

Next.js 16 App Router, React, TypeScript, Tailwind CSS, Leaflet / React Leaflet and Recharts. The project has no backend or authentication. Static scenario files are served from `public/data`; mission and demo state are stored in the browser.

## Run locally

Requirements: Node.js compatible with the installed Next.js version and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Quality checks and production build:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run start
```

The production server command above should be run after the build, on its own. No environment variables are required by the current application.

## Deployment

Import this GitHub repository into Vercel, select the intended branch, keep the project root at the repository root, and use the detected Next.js install/build defaults (`npm install` / `next build`, or the lockfile-aware equivalent). No secrets or environment variables are currently required. After deployment, manually check the main routes and district selection. Weather and map tiles need browser network access to their providers.

## Data provenance and limitations

- Open-Meteo provides current model values and forecasts; these are not physical weather-station observations.
- OpenStreetMap-derived Malir points and facility candidates are geographic references, not verified operational resources. OpenStreetMap attribution is shown in the map.
- Complete, verified administrative district polygons are not included. The Karachi map does not invent district boundaries.
- Malir has a limited set of sourced geographic points. The other six Karachi districts use a non-map scenario because validated household coordinates are unavailable.
- Household needs, incidents, vehicles, shelter capacities, allocations and ETAs are synthetic or simulated. OSM facility candidates are not verified shelters, and their capacities are estimates.
- Mission records and occupancy edits are browser-local and are not shared with responders or other users. Clearing browser storage removes this demo state.
- Nigehbaan is a prototype for demonstration, not an official emergency warning or dispatch service.

See [`docs/GEOGRAPHY_CATALOG.md`](docs/GEOGRAPHY_CATALOG.md), [`docs/BOUNDARY_SOURCE_VERIFICATION.md`](docs/BOUNDARY_SOURCE_VERIFICATION.md), and [`docs/KARACHI_EXPANSION.md`](docs/KARACHI_EXPANSION.md) for geographic coverage, provenance and known gaps.
