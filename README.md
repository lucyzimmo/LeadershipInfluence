
## Dashboard Features

The Leader Influence Dashboard provides a comprehensive suite of analytics and insights organized into the following sections:

### 1. Overview Cards
**Purpose**: Quick summary of key metrics at a glance

**Metrics Displayed**:
- **Verified Voters**: Total count with percentage of supporters verified
- **Total Supporters**: Aggregate count across all topics (unverified)
- **Verification Rate**: Percentage showing credibility foundation
- **Connected Leaders**: Count of allied organizers in your network

**Features**:
- Visual cards with icons and color-coded deltas
- Hover effects for better interactivity
- Responsive grid layout (4 columns on desktop, stacks on mobile)

### 2. This Week's Focus
**Purpose**: Prioritized actionable insights for immediate attention

**Features**:
- Top 3 priority actions displayed prominently
- Each insight includes:
  - Priority number (1-3)
  - Title and description
  - Specific action item
  - Supporting metric
- Gradient styling to draw attention
- Focused on "growing deployable influence"

### 3. Election Influence List (Ballot Items You Can Influence)
**Purpose**: Comprehensive view of all ballot items where your verified voters can have impact

**Features**:
- **Grouped by Election**: Items organized by election date
- **Expandable Rows**: Click to see detailed ballot items within each election
- **Advanced Filtering**:
  - Type filter: All / Races / Measures (color-coded)
  - Level filter: All / Local / State / Federal (color-coded)
  - Urgency filter: All / High / Medium / Low (color-coded)
  - State search: Filter by state name
  - Election search: Filter by election name or date
- **Sorting**: Elections sorted chronologically; items sorted by type and supporter count
- **Rich Item Details**:
  - Item type badges (Race/Measure)
  - Urgency indicators
  - Election type badges (Primary, Runoff, Recall, Ranked Choice)
  - Candidate information for races
  - Measure summaries with Pro/Con snippets
  - Jurisdiction and location details
  - Supporter counts (total and verified)
- **Deduplication**: Measures with same title are consolidated, keeping highest supporter count
- **Summary Statistics**: Shows total items and elections count

### 4. Growth Chart
**Purpose**: Visualize verified voter growth trends over time

**Features**:
- Area chart showing growth trajectory
- Weekly growth rate percentage displayed
- Trend indicators (up/down/stable)
- Responsive chart with hover tooltips
- Date-formatted x-axis
- Gradient fill for visual appeal

### 5. Leader Comparison
**Purpose**: Benchmark your performance against other leaders

**Features**:
- **Comparison Metrics**: 
  - Total supporters
  - Verified voters
  - Verification rate
  - Growth rate
  - Reach
  - Viewpoints/topics
- **Filtering Options**:
  - All leaders
  - Leaders with shared topics
  - Leaders in same states/jurisdictions
  - Similar size leaders (50-150% of your supporter count)
- **Visual Comparison**: Bar charts showing your position relative to others
- **Percentile Rankings**: See where you stand (top 10%, median, etc.)
- **Leader Details**: Expandable cards showing individual leader stats
- **Graceful Degradation**: Only shows when verification data is available

### 6. Geographic Map
**Purpose**: Visual representation of your influence across jurisdictions

**Features**:
- Interactive map showing jurisdiction coverage
- Color-coded regions based on supporter density
- Hover tooltips with jurisdiction details
- Click to drill down into specific areas
- State and local jurisdiction boundaries

### 7. Supporter Engagement
**Purpose**: Track recent growth and verification momentum

**Features**:
- **Recent Growth**: New supporters in last 30 and 90 days
- **Verification Rate**: Percentage of recent joiners who verified
- **Momentum Indicators**: Visual feedback on verification trends
- **Time-based Metrics**: Focus on recent activity vs. historical totals

### 8. Topic Analysis
**Purpose**: Deep dive into each topic/viewpoint group you lead

**Features**:
- **Topic Navigation**: Carousel interface to browse through topics
- **Per-Topic Metrics**:
  - Supporter count (total and verified)
  - Verification percentage
  - Support level assessment (Critical, Needs Support, Developing, Strong)
  - Topic age (days since creation)
  - Recent joiners (30-day and 90-day windows)
  - Leader count (how many leaders lead this topic)
  - Top jurisdictions for this topic
- **Benchmarking**: Compare topic performance to your other topics
- **Visual Indicators**: Color-coded support levels and status badges
- **Strategic Insights**: Recommendations based on topic maturity and support

### 9. Topic Opportunities
**Purpose**: Identify ballot items most relevant to your topics, ranked by opportunity

**Features**:
- **Topic Filtering**: View opportunities by specific topic or all topics
- **Sorting Options**:
  - By opportunity score (default)
  - By relevance score
  - By supporter count
- **Opportunity Scoring**: Combines relevance and potential impact
- **Rich Ballot Item Display**:
  - Topic match percentage
  - Item type and urgency badges
  - Election date and days until
  - Location details
  - Supporter counts
- **Top 20 Display**: Shows highest-scoring opportunities
- **Summary Counts**: See how many opportunities exist per topic

### 10. Network Expansion
**Purpose**: Track leadership development and network growth

**Features**:
- **Connected Leaders**: Count of supporters who lead their own groups
- **New Jurisdictions**: Jurisdictions reached through connected leaders
- **Potential Leaders**: Verified supporters who could become leaders
- **Impact Metrics**: Shows how network expansion increases reach

### 11. Coalition Opportunities (API-Enhanced)
**Purpose**: Identify potential partnerships with aligned leaders

**Features**:
- **Leader Matching**: Find leaders with overlapping jurisdictions
- **Synergy Scoring**: Percentage score showing partnership potential
- **Shared Metrics**:
  - Supporter counts
  - Shared jurisdictions count
  - Shared ballot items count
- **Partnership Cards**: Detailed view of each potential coalition partner
- **Strategic Insights**: Understand why partnerships make sense

### 12. Movement Velocity (API-Enhanced)
**Purpose**: Growth momentum analysis and projections

**Features**:
- **Growth Rate**: Supporters per week with trend direction
- **Projections**:
  - Expected growth in 30 days
  - Expected growth in 90 days
- **Trend Indicators**: Visual feedback on acceleration/deceleration
- **Benchmark Comparison**: Compare your velocity to similar leaders
- **Strategic Planning**: Use projections for goal setting

---

## Page Layout & Information Architecture

The dashboard is organized in a logical flow from high-level overview to detailed analysis:

1. **Header**: Title, description, and last updated timestamp
2. **Overview Cards**: Quick metrics summary
3. **This Week's Focus**: Prioritized actions
4. **Election Influence List**: Most actionable section (specific ballot items)
5. **Growth Chart**: Momentum visualization
6. **Leader Comparison**: Benchmarking context
7. **Geographic Map**: Spatial context
8. **Supporter Engagement**: Engagement metrics
9. **Topic Analysis**: Topic deep dive
10. **Topic Opportunities**: Topic-based actionable items
11. **Network Expansion**: Network metrics
12. **Coalition Opportunities**: Partnership opportunities
13. **Movement Velocity**: Forward-looking projections

This order prioritizes actionable insights early, provides context in the middle, and ends with strategic planning tools.

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
