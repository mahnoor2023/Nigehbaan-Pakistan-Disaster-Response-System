# Karachi expansion requirements

## Scope and boundary

The current MVP contains one demonstration area: Malir (Cantt side). “Karachi City” must not be presented as operational coverage until every area admitted to the product passes the requirements below. Phase 0A documents these requirements only; it does not add a backend, authentication, deployment, or live dispatch integration.

## Geographic coverage

- Obtain a versioned Karachi administrative boundary and versioned sub-area boundaries from an authoritative or explicitly licensed source.
- Decide the operational unit (district, town, union committee, or response sector) with the agencies that will maintain it. Do not mix units in `area` identifiers.
- Give every area a stable ID, display label, bounding geometry, map center, zoom, source, license, retrieval date, and boundary version.
- Check seams, overlaps, coastline handling, and coverage gaps. A point must resolve deterministically to one response area or to an explicit out-of-coverage state.
- Replace the illustrative entries in `data/areas.json` with reviewed coverage records. A bounding box is acceptable for data acquisition, but not as an operational boundary.

## Required datasets and provenance

For each area, provide building or household locations, terrain/elevation, waterways and drains, candidate shelters, and rescue-resource bases. Every field must declare one of: authoritative, externally derived, field reported, synthetic, or unknown. Store source organization, source record ID where available, license, collected/retrieved time, transformation version, and last verification time.

Synthetic demographics, demo-list membership, capacities, and fleets must remain visibly labeled synthetic in source data, generated JSON, user interfaces, exports, and documentation. OSM-derived building geometry must not be described as a household survey or satellite detection. Unknown values remain `null`; they must not be silently converted into observed facts.

## Shelter readiness

- Verify that each candidate location is approved and usable as a flood shelter; an OSM amenity is not sufficient evidence.
- Record a verified safe capacity, the authority and time of verification, accessibility, medical capability, utilities, contact channel, opening status, and hazards affecting access.
- Define whether capacity means beds, people, or households and use one unit throughout dispatch and occupancy.
- Reject negative occupancy and cap occupancy and planned arrivals at capacity. Reconcile concurrent updates before operational use; the Phase 0A browser-local clamp does not solve multi-device concurrency.
- Define stale-data thresholds and remove or quarantine closed, duplicate, unreachable, or unverified shelters.

## Household and vulnerability data

- Establish lawful purpose, minimum necessary fields, consent or other legal basis, retention, deletion, and access policies before collecting identifiable household data.
- Validate coordinates, duplicate detection, household counts, accessibility needs, alert reachability, and field-verification status.
- Publish missing-data and confidence rules. Synthetic attributes may be used for demonstrations and testing only, never as claims about real residents.
- Agree on a safe workflow for reports that cannot find a household, conflicting reports, and corrections.

## Hazard, routing, and operations

- Connect approved rainfall, river/drain, inundation, road-closure, and forecast sources with timestamps, units, refresh intervals, outage behavior, and uncertainty.
- Replace straight-line routing and assumed speeds with validated multimodal routing that accounts for closures, water depth, vehicle limits, turnaround time, and repeat trips.
- Validate prioritization with disaster-response and community stakeholders, including bias and accessibility review. Define override authority and preserve reasons for every decision.
- Establish incident ownership, dispatch acknowledgement, cancellation, reassignment, shelter acceptance, audit, escalation, and offline-conflict procedures.

## Quality gates for adding an area

An area can be marked “demo available” only when its static files pass schema, coordinate, unique-ID, provenance-label, and capacity tests. It can be marked “operational” only after authoritative boundary review, field validation, shelter approval, data-protection review, security testing, multi-user concurrency controls, responder training, an exercised outage plan, and written sign-off from the responsible agencies.

City-wide release verification must include:

1. Coverage and boundary tests for all admitted areas.
2. Schema and provenance checks with zero ambiguous synthetic labels.
3. Capacity invariants showing recorded occupancy plus planned arrivals never exceeds verified capacity.
4. Scenario tests for missing feeds, stale records, duplicate reports, blocked routes, full shelters, and area hand-offs.
5. Accessibility, performance, security, privacy, and disaster-recovery acceptance evidence.

## Phase exclusions

Backend services, authentication/authorization, cross-device synchronization, live operational feeds, deployment, and Phase 0B features remain outside Phase 0A. They are prerequisites for operational use, not implied by this stabilization work.
