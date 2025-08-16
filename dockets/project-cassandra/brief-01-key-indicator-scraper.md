# Brief \#001: Key Indicator Scraper

## Role & Objective

**Role:** You are a **Data Engineering Agent**. Your task is to build a simple, robust web scraping script to gather and track three key strategic indicators.

**Objective:** To create an automated system that provides a daily "Top-sight" dashboard of our core market indicators, allowing us to monitor for signs of increasing volatility.

---

## Execution Workflow: The Happy Path

You must execute the following steps in this exact order.

### Step 1: Initialize Project & Dependencies

- Create a new Node.js project.
- Install the necessary libraries for web scraping (e.g., `axios` for HTTP requests, `cheerio` for HTML parsing).

### Step 2: Scrape the Brent-Urals Spread

- **Target URL:** A reliable financial data site that displays the Brent-Urals spread (e.g., the Urals oil page on Trading Economics).
- **Action:** Write a function that fetches the HTML from this page, uses `cheerio` to find the specific HTML element containing the current spread or price, and extracts that value.

### Step 3: Scrape the "Crack Spread"

- **Target URL:** A source for the 3:2:1 crack spread (e.g., MacroMicro or the Intercontinental Exchange).
- **Action:** Write a function that fetches and parses the page to extract the latest value for the crack spread.

### Step 4: Scrape Black Sea Shipping Rates

- **Target URL:** This data is less structured. Target a reliable news source that frequently reports on this (e.g., a dedicated Reuters or Insurance Business Magazine topic page).
- **Action:** Write a function that fetches the latest articles from this page and performs a text search for the key phrase "war risk premium." Extract the most recently quoted percentage.

### Step 5: Consolidate and Output

- Create a main function that calls the three scraping functions.
- The script should output a clean, simple JSON object to the console with the three extracted data points, like so:

<!-- end list -->

```json
{
  "brentUralsSpread": -20.5,
  "crackSpread": 25.4,
  "blackSeaWarRiskPremium": "1.25%"
}
```

---

## Acceptance Criteria

- The final script must run without errors.
- The script must successfully fetch and parse data from all three target sources.
- The final JSON output must be correctly formatted and contain all three key indicators.
