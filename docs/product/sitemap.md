# Sitemap

## Public
- `/`
  - Primary entry point with search prompt, location action, disclaimer, and featured shelters.
- `/find`
  - Search results page for address or location-based shelter lookup.
- `/beskyttelsesrum/[slug]`
  - Shelter detail page with status, capacity, accessibility, municipality, and source information.
- `/kommune/[slug]`
  - Municipality landing page with summary copy and shelter listing.
- `/om-data`
  - Data transparency page describing sources, update flow, and limitations.

## Internal
- `/admin`
  - Placeholder for future operational tools. No auth UI in the first pass.

## SEO Notes
- Municipality pages should be indexable and internally linked.
- Shelter detail pages should expose structured, trustworthy metadata and clear titles.
- `/om-data` should explain source provenance and known gaps.
