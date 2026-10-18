# Geographic catalog

## Scope

Phase 0B.1 introduces a versioned administrative hierarchy for Nigehbaan:

`Pakistan > province/territory > division > district > subdivision`

The schema is generic, but the catalog is deliberately partial. It contains the seven required province/territory navigation entries and detailed records only for Karachi Division. It is not a complete directory of Pakistan's divisions or districts.

- Catalog version: `2026-10-18`
- Schema version: `1.0.0`
- Identifier scheme: `nigehbaan-internal-v1` (not an ISO or government coding scheme)

## Sources

| Source | Use | Retrieved |
| --- | --- | --- |
| [Pakistan Bureau of Statistics — 7th Population and Housing Census 2023 Field Operation Plan](https://www.pbs.gov.pk/sites/default/files/population/2023/FOP_final_26-2-23_final.pdf) | National hierarchy and province/territory context | 2026-10-18 |
| [Commissioner Karachi — Karachi Division Administrative Area Directory](https://commissionerkarachi.gos.pk/area-map) | Seven Karachi districts and 31 subdivisions | 2026-10-18 |

The Commissioner directory is an administrative listing, not a reusable GIS dataset. Phase 0B.1 therefore does not ship district polygons, trace the displayed map, or represent points or bounding boxes as boundaries.

Phase 0B.3A adds typed source and district-dataset manifests, but does not change this geometry status. Candidate assessment and the acquisition gate are documented in [BOUNDARY_SOURCE_VERIFICATION.md](./BOUNDARY_SOURCE_VERIFICATION.md).

## Coverage semantics

- `directory_only`: a sourced navigation record exists; response data is not loaded.
- `demo_available`: limited synthetic demonstration data exists. This is not district-wide or operational coverage.
- `operational`: reserved for locations that satisfy the operational quality gates in `KARACHI_EXPANSION.md`. No Phase 0B.1 location has this status.

All seven Karachi districts are `demo_available`. Malir retains the existing limited OSM-derived point sample. Central, East, South, West, Keamari, and Korangi use deterministic synthetic response scenarios on abstract exercise grids, with no geographic marker coordinates or district polygons. All subdivisions remain navigation records only.

Keamari additionally has an ODbL-attributed OpenStreetMap administrative relation reference (`relation/16351022`). Its Nominatim representative point is catalog metadata for identification only; it is not displayed on the operational map and does not change Keamari's non-map status.

## Karachi detail

| District | Subdivisions |
| --- | --- |
| Central | Gulberg, Liaquatabad, Nazimabad, New Karachi, New Nazimabad |
| East | Ferozabad, Gulshan-e-Iqbal, Gulzar-e-Hijri, Jamshed Quarters |
| South | Arambagh, Civil Lines, Garden, Lyari, Saddar |
| West | Mango Pir, Mominabad, Orangi Town |
| Keamari | Baldia, Harbor, Maripur, SITE |
| Korangi | Korangi, Landhi, Model Colony, Shah Faisal |
| Malir | Airport, Bin Qasim, Gadap, Ibrahim Hyderi, Murad Memon, Shah Mureed |

## Known gaps and next ingestion gate

- Division, district and subdivision records outside Karachi have not yet been retrieved and verified.
- No authoritative or clearly licensed full-country GeoJSON was verified for this phase.
- Names and boundaries can change. Every future import must retain source record identifiers where available, source URL, license, retrieval date and boundary version.
- Future geometry must pass coordinate-system, validity, overlap, gap, coastline and deterministic point-resolution checks before display.
- A location appearing in the directory must never imply live alerts, responder availability or emergency-service coverage.

Additions should extend `src/lib/geography.ts` and its tests without changing existing stable IDs. If an official identifier becomes available, store it as source metadata rather than replacing the internal ID.
