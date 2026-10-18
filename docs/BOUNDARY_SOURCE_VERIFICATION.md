# Karachi boundary source verification

## Phase 1B/1C focused source check — 2026-10-18

One time-boxed check found no complete, current, legally reusable seven-district polygon package ready to ship. [PBS 2023 district tables](https://www.pbs.gov.pk/result-excel/) confirm the seven administrative identities, including Keamari, but do not supply geometry. The [PBS data dissemination policy](https://www.pbs.gov.pk/data-dissemination/) says block maps, shapefiles and geo-coordinates have controlled release terms; no blanket redistribution permission for its GIS layers was established. The [geoBoundaries Pakistan ADM2 candidate](https://www.geoboundaries.org/api/current/gbOpen/PAK/ADM2/) is dated 2019, before Keamari's creation. Existing OSM relation metadata verifies only a candidate identity, not seven complete polygons. Accordingly all seven polygon states remain unverified, the boundary toggle remains disabled, and no geometry was imported. PBS permission or a dated OSM extract plus relation assembly, ODbL compliance, CRS/topology checks and seven-district reconciliation are still required.

## Phase 1A update — 2026-10-18

The Commissioner Karachi [administrative directory](https://commissionerkarachi.gos.pk/area-map) was checked again for the seven current districts and 31 subdivisions, including Keamari. It remains an administrative listing, not a downloadable, reusable polygon layer. [PBS GIS](https://www.pbs.gov.pk/gis/) remains an authoritative candidate, but no directly reusable seven-district vector file with clear redistribution terms has been verified. [OpenStreetMap](https://www.openstreetmap.org/copyright) boundary relations are reusable under ODbL with attribution and share-alike obligations, but the seven complete relations have not been acquired, assembled, topology-checked and reconciled with current districts. The 2019 geoBoundaries ADM2 layer remains unsuitable because it predates the current seven-district directory. **No district polygon is shipped or drawn in Phase 1A.**

The city overview uses only the [Wikidata Karachi Q8660 coordinate statement](https://www.wikidata.org/wiki/Q8660), retrieved 2026-10-18: 24°51′36″N, 67°0′36″E (24.86, 67.01), WGS84/EPSG:4326 Point. Wikidata [structured data is CC0](https://www.wikidata.org/wiki/Wikidata:Licensing); attribution is provided voluntarily. This community-sourced reference was imported from Russian Wikipedia and is an approximate city overview anchor, **not** a district centroid, boundary, verified facility or response location. The basemap uses [OpenStreetMap standard tiles](https://operations.osmfoundation.org/policies/tiles/) with visible OSM/ODbL attribution; tile availability is best-effort and browser network success has not been confirmed.

The new boundary geometry screen rejects non-polygons, non-WGS84 coordinates, open/zero-area/self-intersecting rings and implausible Karachi-scale coordinates. It is a preliminary filter, not a substitute for full GIS topology review, source licensing, currency and cross-district overlap/gap checks. No candidate was promoted to verified status.

| District | Phase 1A polygon | Map detail |
| --- | --- | --- |
| Central | Not verified | City basemap and directory; synthetic demo has no geographic household points |
| East | Not verified | City basemap and directory; synthetic demo has no geographic household points |
| South | Not verified | City basemap and directory; synthetic demo has no geographic household points |
| West | Not verified | City basemap and directory; synthetic demo has no geographic household points |
| Keamari | Not verified | City basemap and directory; OSM relation reference is metadata only |
| Korangi | Not verified | City basemap and directory; synthetic demo has no geographic household points |
| Malir | Not verified | Existing limited OSM-derived building/facility samples may be shown; attributes and rescue simulation remain synthetic |

The existing Malir resource coordinates are jittered synthetic staging positions in `scripts/build-data.mjs`, not sourced GPS; the Phase 1A city map does not display them. The Command Center's pre-existing simulated route map is unchanged.

Phase 0B.3A records candidate sources without publishing administrative polygons. Retrieval and reconnaissance were performed on 2026-10-18. No large geographic dataset was downloaded.

## Result

No source has yet passed all three gates required for use: current seven-district coverage, valid reusable polygon geometry, and confirmed redistribution terms. Central, East, South, West, Keamari, Korangi and Malir therefore remain `boundary_candidate`; none is `boundary_verified`.

A bounded OpenStreetMap metadata check on 2026-10-18 verified that relation `16351022` is tagged `boundary=administrative`, `admin_level=6`, and `name:en=Keamari District` (relation version 3, updated 2023-11-06). Nominatim returned a representative search point under ODbL. The catalog stores that relation ID, its tags, timestamps, attribution, and reference point strictly as directory-label metadata. Its geometry was not downloaded or validated, so Keamari remains a non-map scenario and the point cannot be used for response markers, routing, or as a boundary substitute.

Bounding boxes, centroids and manually traced map images are not acceptable substitutes for district boundaries.

## Candidates

| Candidate | Date represented | License / reuse | Reconnaissance result |
| --- | --- | --- | --- |
| [Commissioner Karachi directory](https://commissionerkarachi.gos.pk/area-map) | Current page retrieved 2026-10-18 | No reusable vector-data license located | Authoritative confirmation of seven districts and 31 subdivisions. It provides a directory and displayed map, not downloadable polygon geometry. The map will not be traced. |
| [PBS Geography/GIS](https://www.pbs.gov.pk/gis/) and [Pakistan Spatial Insights](https://psi.pbos.gov.pk/) | Census 2023 | Exact terms for a downloadable district layer still require verification | PBS states that it prepares national, provincial, divisional, district and tehsil layers. No directly downloadable Karachi polygon artifact with unambiguous redistribution terms was identified. Portal tiles will not be scraped. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) via Overpass | OSM base timestamp 2026-10-18T04:52:21Z | ODbL 1.0; attribution and share-alike conditions apply | A small count query found 50 administrative relations inside the Karachi reconnaissance extent. Relation-tag and geometry queries failed or timed out, so that route verified no closed polygon. A later bounded metadata lookup verified only the Keamari reference listed below. |
| [OpenStreetMap relation 16351022](https://www.openstreetmap.org/relation/16351022) via Nominatim and OSM API 0.6 | Relation updated 2023-11-06; retrieved 2026-10-18 | ODbL 1.0 | Keamari name and administrative tags are verified as community metadata. No geometry was acquired or validated; the representative point is catalog-only. |
| [geoBoundaries Pakistan ADM2](https://www.geoboundaries.org/api/current/gbOpen/PAK/ADM2/) | 2019 | Layer metadata declares Public Domain | Metadata reports 126 units and cites geoBoundaries/Wikipedia. It predates the current seven-district Commissioner directory and is rejected as the Phase 0B.3 boundary source. |

## Accuracy and operational limitations

- Administrative names do not prove that a polygon is current, topologically valid or officially adopted.
- Keamari is the critical freshness check; any source that cannot independently represent it as a district fails the seven-district requirement.
- OSM relation presence does not prove official accuracy. A candidate relation must be assembled, geometry-validated and cross-checked against PBS/Commissioner records.
- Polygon publication does not establish household, shelter, hospital, fire-station or rescue-resource availability.
- OSM facilities must retain `operationalStatus: "unknown"`. Schools, hospitals, community centres and places of worship must not be converted into shelters.

## Exact acquisition gate for Phase 0B.3B

1. Obtain a PBS Karachi district vector layer or written confirmation of the applicable download and redistribution terms.
2. Obtain the seven candidate OSM relation IDs and complete relation geometries from a dated, checksummed OSM source. Use Overpass only for small verification queries; use a pinned Geofabrik PBF for reproducible bulk processing after approval.
3. Confirm all seven outputs are `Polygon` or `MultiPolygon`, including a distinct Keamari geometry.
4. Validate CRS, ring closure, self-intersections, duplicate parts, district overlaps/gaps, and containment within Karachi Division.
5. Compare district names and areas with the Commissioner directory and document discrepancies rather than silently repairing them.
6. Select a source only after license, geometry and currentness gates pass. Record its native feature IDs, source snapshot, checksum and attribution in the district manifests.

Until these steps pass, the application must not render district boundaries or place scenario markers on a geographic map. Coordinate-free synthetic exercises may run only with an explicit non-map disclosure.
