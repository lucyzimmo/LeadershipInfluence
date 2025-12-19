# Leader Influence Dashboard — Product Brief

## 1. What does "influence" mean on Sway?

On Sway, **influence is not popularity**. Popularity represents interest or alignment, but influence only exists when that interest can be **credibly deployed in real elections**.

**Influence on Sway is defined as a leader's ability to credibly shape real electoral decisions by organizing verified voters in the jurisdictions and elections where those decisions are made.**

A leader with 10,000 supporters who cannot vote in the same election has less influence than a leader with 500 verified voters concentrated in a decisive local race. Influence emerges when a leader's supporter network meets four conditions:

* **Credibility**: supporters are verified, eligible voters
* **Context**: those voters can act on specific ballot items (races or measures)
* **Concentration**: support is focused geographically and temporally
* **Growth capacity**: the network can compound through recruitment, verification, and allied organizers

In product terms:

* **Popularity = potential energy**
* **Influence = kinetic energy**

The Leader Influence Dashboard exists to show leaders **where their potential turns into real political leverage**, and how to grow it.

---

## 2. Which 3–5 metrics matter most?

The dashboard focuses on metrics that are **measurable from existing data**, **actionable for leaders**, and **honest about what Sway can claim today**.

### 1. Verified Voter Base (and Growth Rate)

* Count of verified voters aligned with the leader
* Trend over time (weekly growth rate)
* Verification rate (% of supporters who are verified)

**Why it matters:** Verification is the foundation of credible influence. Growth rate is a leading indicator of movement health.

---

### 2. Jurisdiction Concentration Index

* Distribution of verified voters across jurisdictions (HHI metric)
* Share of total voters concentrated in top jurisdictions
* Specific recommendations based on concentration level

**Why it matters:** Influence depends on density. Concentrated support creates leverage; diffuse support creates potential. The dashboard provides actionable guidance: too scattered = focus recruitment in one area; too concentrated = diversify to reduce fragility.

---

### 3. Ballot Exposure by Race / Measure

* Number of verified voters who will see each ballot item
* Ranked by leverage score (voters × level multiplier × urgency)
* Searchable by location and sortable by date or leverage

**Why it matters:** Influence only exists where voters intersect with real decisions. This metric translates supporters into concrete electoral leverage with clear prioritization.

---

### 4. Supporter Activity & Growth Momentum

* Recent joiners (30-day and 90-day cohorts)
* Verification rate of recent joiners
* Growth trends to identify momentum or plateau

**Why it matters:** Past influence doesn't guarantee future influence. Active recruitment and verification are leading indicators of sustainable political power.

---

### 5. Network Expansion Signal

* Connected leaders (supporters who lead their own groups)
* New jurisdictions unlocked through allied organizers
* Potential leaders identified in your network

**Why it matters:** Durable influence compounds through organizer networks, not just follower counts. This measures whether your movement is creating autonomous capacity vs. centralized dependency.

---

## 3. What insights and actions should the dashboard enable?

The dashboard is **prescriptive, not just descriptive**. It should help leaders answer:

* *Where does my influence actually exist right now?*
* *Which elections and ballot items matter most to my network?*
* *Where should I invest time and outreach next?*

### "This Week's Focus" — Primary Action Directive

The dashboard derives top 3-5 actionable insights dynamically:

* **Urgent races**: High-leverage elections happening soon (e.g., "Focus on [Race] — Election in 23 days, 247 verified supporters")
* **Verification opportunities**: Low verification in high-concentration areas (e.g., "Increase verification in [Jurisdiction] — 35% unverified in your strongest area")
* **Network expansion**: Recruit allied organizers when you have engaged supporters but few connected leaders
* **Strategic preparation**: Medium-urgency races with significant leverage that need groundwork now

**The goal:** Leaders should be able to open the dashboard and immediately know what to do this week.

### Examples of insights → actions:

* **Insight:** 68% of verified voters are concentrated in two jurisdictions with elections in the next 60 days
  **Action:** Prioritize voter guides and recruitment campaigns in those jurisdictions

* **Insight:** A local race has 150 verified supporters but election is in 18 days
  **Action:** Create targeted voter mobilization plan and get-out-the-vote messaging

* **Insight:** Network growth is plateauing and you have 45 potential leaders
  **Action:** Encourage trusted supporters to start their own organizing groups in adjacent communities

* **Insight:** Geographic concentration is dangerously high (HHI > 0.5)
  **Action:** Diversify before a single jurisdiction determines your entire influence

---

## 4. What's out of scope (and why)?

To remain accurate, neutral, and stage-appropriate, the following are explicitly out of scope for this MVP:

* **Predicting election outcomes**
  Requires historical turnout data, competitive race analysis, and introduces forecasting liability

* **Persuasion or vote-switching measurement**
  Sway tracks alignment and organization, not opinion change or conversion

* **Individual-level targeting or micro-profiling**
  The focus is aggregate, privacy-preserving influence, not voter targeting or surveillance

* **Real-time competitive benchmarking**
  Current implementation shows leader comparison when API data is available, but doesn't create competitive incentives that prioritize popularity over meaningful leverage. Leaders see their ranking but the focus remains on actionable improvements, not competitive positioning.

* **Advanced electoral analytics (for now)**
  Features like race competitiveness, historical turnout modeling, and coalition synergy scores are implemented but require API integration. The dashboard gracefully degrades to static data when unavailable.

These capabilities are intentionally limited or deferred to protect trust, accuracy, and focus while building toward scale.

---

## 5. Strategic & Technical Thinking

### Shortcuts and Simplifications

**Data Loading:**
- All analytics computed in-memory from ~40MB of JSON files on each request
- No database, caching, or incremental computation
- Parallel loading and computation mitigate performance impact for now

**Metric Computation:**
- Leverage scores use simplified multipliers (local 3x, state 2x, federal 1x) based on typical turnout
- HHI concentration index assumes uniform electoral impact across jurisdictions
- Growth rates use simple 30-day windows without seasonality adjustment
- Supporter engagement score removed when insufficient data rather than attempting imputation

**API Integration:**
- Graceful degradation: features work with static data, enhanced with API when available
- JWT caching (2.5 days) reduces auth overhead
- Leader comparison only shown when verification data is calculable
- No retry logic or sophisticated error handling

**UI/UX:**
- Client-side rendering with loading states
- No pagination (assumes <500 ballot items, <100 jurisdictions)
- Search is client-side string matching (no fuzzy search or ranking)
- No data export, PDF generation, or sharing features

### Necessary Assumptions

1. **Data Quality**: Voter verifications are accurate and up-to-date; jurisdiction mappings are correct
2. **Leader Identity**: Single leader per dashboard (no multi-leader view or switching)
3. **Temporal Scope**: Focus on next 6 months of elections (not multi-year strategy)
4. **Geographic Scope**: US-centric (assumes state/county/city jurisdiction hierarchy)
5. **Network Structure**: Supporters belong to viewpoint groups led by leaders; clear leader/supporter distinction
6. **Verification Model**: Binary verified/unverified (no partial verification states)
7. **API Availability**: Enhanced features require Sway API but aren't blocking for core functionality

### What Would Break at 100k Supporters or 100k Leaders?

**Performance:**
- **40MB+ JSON files** loaded on every request would be unsustainable
- **In-memory computation** of 100k+ relationships would cause timeouts
- **Client-side search/filtering** would lag with 1000+ ballot items
- **No pagination** means UI would be unusable with 500+ items

**Scalability Issues:**
- Metric computation from scratch on each request (no caching/materialized views)
- All data joins happen in application code (no database query optimization)
- GraphQL queries would hit rate limits or timeout
- Browser memory limits with large client-side datasets

**Needed Changes:**
- **Database**: Move to PostgreSQL with indexed lookups on person_id, jurisdiction_id, group_id
- **Materialized views**: Pre-compute metrics hourly/daily instead of on-demand
- **Pagination**: Server-side pagination for ballot exposure, jurisdictions, leaders
- **Incremental computation**: Update metrics based on deltas, not full recalculation
- **API optimization**: Batch requests, implement GraphQL query complexity limits
- **Background jobs**: Compute slow metrics (network expansion, coalition opportunities) asynchronously
- **CDN/caching**: Cache static dashboard data with smart invalidation

### New Capabilities at Scale (with multi-leader data)

**Coalition Intelligence:**
- Identify leaders with overlapping jurisdictions and complementary ballot exposure
- Suggest strategic partnerships based on geographic gaps and shared priorities
- Calculate combined leverage (e.g., "You + 3 allied leaders have 1,200 verified voters in this district")

**Competitive Benchmarking:**
- Percentile rankings across leaders (top 10% by verification rate, growth, etc.)
- Similar-leader cohorts ("Leaders like you average 45% verification rate")
- Growth trajectory comparison ("You're growing 2.3x faster than median")

**Movement Velocity Insights:**
- Compare your growth to benchmark groups with similar supporter counts
- Identify outlier jurisdictions where you're over/under-performing vs. similar leaders
- Trend direction: accelerating, steady, or decelerating growth

**Network Effect Analytics:**
- Track indirect influence through connected leaders
- Measure "second-degree" reach (supporters of your supporters who became leaders)
- Identify which of your supporters are most effective at recruiting verified voters

**Topic/Issue Clustering:**
- Group leaders by shared topics/viewpoints to find natural coalitions
- Identify topic areas where you have supporter depth vs. breadth
- Suggest topic expansion based on supporter interests

**Predictive Analytics (carefully):**
- Forecast verification rate based on historical cohort behavior
- Estimate time-to-critical-mass in target jurisdictions
- Model impact scenarios: "If you recruit 50 more verified voters in District X, you'd move from marginal to significant leverage"

### What to Build Next — and Why

**1. Database Migration (Immediate Priority)**
- **Why**: Current in-memory approach won't scale beyond early testing
- **Impact**: 100x performance improvement, enables real-time updates
- **Complexity**: High (data migration, schema design, query optimization)

**2. Actionable Workflow Integration**
- **Why**: Dashboard shows insights but doesn't help execute them
- **Features**:
  - One-click voter guide creation for prioritized races
  - Bulk messaging to supporters in specific jurisdictions
  - Verification campaign templates ("Get 100 supporters in [Jurisdiction] verified by [Date]")
  - Task tracking: mark insights as "in progress" or "completed"
- **Impact**: Transforms passive analytics into active organizing tool
- **Complexity**: Medium (requires integrations with Sway's existing features)

**3. Connected Leader Network View**
- **Why**: Leaders organizing leaders is the key to scale
- **Features**:
  - Visual network map showing your supporters who became leaders
  - Jurisdiction coverage heatmap (where do connected leaders expand your reach?)
  - Collaborative campaigns: coordinate with allied leaders on shared ballot items
- **Impact**: Enables federated organizing strategy
- **Complexity**: Medium (network graph visualization, multi-leader permissions)

**4. Historical Trend Analysis**
- **Why**: Point-in-time metrics lack context
- **Features**:
  - 6-month or 1-year time series for all key metrics
  - Annotations: mark major recruitment drives, media hits, events
  - Seasonal decomposition: identify natural growth cycles
  - "Replay" mode: see your dashboard state at any past date
- **Impact**: Learn what tactics worked, plan for cyclical patterns
- **Complexity**: Medium (time-series storage, date range queries)

**5. Mobile-First Experience**
- **Why**: Leaders organize on the go
- **Features**:
  - Mobile-optimized layout with touch-friendly controls
  - Push notifications for urgent insights ("Election in 7 days, 200 supporters not yet contacted")
  - Offline mode for viewing cached dashboard
  - Quick-action widgets ("Share verification link", "Post voter guide")
- **Impact**: Increases dashboard usage and real-time responsiveness
- **Complexity**: High (responsive redesign, native notifications, offline sync)

**Why This Order?**

1. **Database first**: Nothing else scales without it
2. **Workflows second**: Converts insights into action (the product's core promise)
3. **Network view third**: Unlocks the compounding growth model
4. **Trends fourth**: Adds sophistication once basics work well
5. **Mobile fifth**: Optimizes UX once features are proven

---

**Summary:**

The Leader Influence Dashboard translates Sway's core promise — *Vote with people you trust to create real political power* — into a concrete, decision-making tool. It shows leaders where their network's potential becomes real influence, and how to grow that influence responsibly over time.

The current implementation balances **honesty** (showing only what we can measure), **actionability** (clear next steps), and **scalability** (graceful degradation, API-enhanced features). It's designed as a foundation that can grow from dozens of leaders to thousands while maintaining its core principle: **influence ≠ popularity**.
