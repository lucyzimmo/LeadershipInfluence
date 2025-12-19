
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
