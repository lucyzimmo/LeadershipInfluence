# Strategic & Technical Thinking

## What shortcuts or simplifications did you make?

To fit the time constraint and focus on decision quality over infrastructure, the following simplifications were made:

### Data & Infrastructure

**In-Memory Computation**
- All analytics computed from static JSON files (~40MB) on each request
- No database, caching layer, or incremental computation
- All joins and aggregations handled in application code using Map/Set data structures
- Performance acceptable for prototype scale (~1000 supporters, ~100 jurisdictions)

**Rationale**: This approach prioritizes rapid iteration and clarity. Every metric calculation is transparent and auditable. The tradeoff is that this won't scale beyond ~10k supporters without significant latency.

### Metric Modeling

**Leverage Scores**
- Simple, transparent heuristics combining:
  - Office-level multipliers (federal > state > local)
  - Time-to-election decay (exponential decay for urgency)
  - Verified supporter count thresholds
- No predictive models or machine learning

**Lack of Referral Data**
- Referrals would be an excellent way to track supporter engagement and network expansion
- This was not made available in the data

**Jurisdiction Concentration**
- Standard Herfindahl-Hirschman Index (HHI) without adjusting for:
  - Turnout variance by jurisdiction
  - Voter registration rates
  - Historical electoral competitiveness
- Concentration risk uses simple thresholds (HHI > 0.5 = high risk)

**Growth Trends**
- Recent time windows (30/90 days) without:
  - Seasonality adjustments
  - Cohort normalization
  - Statistical significance testing
- Weekly growth rate uses simple linear regression on last 4 weeks

**Topic Analysis**
- Multi-viewpoint group support exists but comparison across topics is limited
- Topic metrics computed independently without cross-topic normalization
- Topic opportunities use simple ballot item matching
- More topic data would mean more opportunities surfaced with our algorithm

**API Integration**
- External Sway API features (CivicEngine context, coalition discovery, benchmarks) are rate-limited
- Dashboard degrades gracefully when API data unavailable
- Core functionality never blocked by API failures
- API enhancements are additive, not required

## What assumptions were necessary for this prototype?

**Data Quality**
- Jurisdiction mappings are correct and stable
- Voter verification records accurately reflect registration status
- Ballot item data is complete and up-to-date for upcoming elections

**User Model**
- Supporters belong to a single leader's primary viewpoint group for this dashboard
- Leader/supporter roles are explicit (leader = leader of viewpoint)
- Multi-group membership exists but primary group is clear

**Measurement Scope**
- Influence measured at aggregate level, not individual voter level
- Strategic horizon is ~6 months (upcoming elections)
- US-centric electoral structure (state, county, city jurisdictions)

**Privacy & Neutrality**
- No individual voter targeting or contact information
- No voting history or preference inference
- No electoral outcome prediction
- 
**Rationale**: These assumptions allow the dashboard to remain accurate without inferring data Sway does not yet collect.

## What would break or need redesign at 100k supporters or 100k leaders?

At scale, several aspects of this MVP would require redesign:

### Performance & Architecture

**Current Limits**
- Loading ~40MB of JSON on every request becomes infeasible (>5s load time)
- In-memory joins across hundreds of thousands of relationships cause timeouts
- Client-side filtering and sorting of large ballot/jurisdiction lists degrades UX
- API calls for leader comparisons and coalition discovery hit rate and latency limits

**Required Changes**

**1. Database Migration**
- Move to PostgreSQL with indexed joins on person, group, and jurisdiction IDs
- Denormalize frequently accessed relationships (e.g., supporter → jurisdiction mapping)
- Partition large tables by jurisdiction or time period

**2. Materialized Metrics**
- Pre-compute core metrics (verified voters, jurisdiction counts, ballot exposure)
- Incremental updates instead of full recomputation
- Background jobs for expensive metrics (network expansion, coalition analysis)
- Smart invalidation on data changes

**3. Caching Strategy**
- Redis cache for dashboard responses with TTL-based invalidation
- CDN for static metric visualizations
- Client-side caching with service workers for offline access

**4. Pagination & Filtering**
- Server-side pagination for ballot items, jurisdictions, and leader lists
- Elasticsearch or similar for complex filtering and search
- Virtualized lists for large datasets in UI

**5. API Rate Limiting & Batching**
- Batch API requests where possible
- Implement request queuing and retry logic
- Cache API responses with appropriate TTLs
- Fallback to static data when API unavailable

### Data Model Extensions

**Multi-Leader Support**
- Supporters can belong to multiple groups (already in data model)
- Aggregate metrics across all groups a leader manages
- Cross-group coalition analysis

**Historical Tracking**
- Time-series data for all metrics (not just verified voters)
- Historical snapshots for trend analysis
- Event logging for audit trails

**Real-Time Updates**
- WebSocket or polling for live metric updates
- Incremental metric recalculation on data changes
- Push notifications for urgent actions

## What new capabilities would you add at scale (perhaps with information from other leaders)?

With multi-leader data and a scalable backend, Sway could unlock higher-order influence analytics:

### Coalition Intelligence

**Current**: Basic coalition opportunities based on shared jurisdictions

**At Scale**:
- Identify leaders with overlapping jurisdictions or complementary ballot exposure
- Estimate combined leverage across coalitions
- Suggest partnerships where marginal collaboration yields outsized impact
- Model coalition formation scenarios ("What if we partner with Leader X?")

**Technical Requirements**:
- Graph database for relationship analysis (Neo4j or similar)
- Network analysis algorithms (community detection, influence propagation)
- Real-time coalition matching engine

### Network Effect Analytics

**Current**: Connected leaders and new jurisdictions unlocked

**At Scale**:
- Measure second-degree reach (supporters of supporters who become leaders)
- Identify which organizers unlock new jurisdictions most effectively
- Track network depth vs. breadth over time
- Model network growth scenarios

**Technical Requirements**:
- Graph traversal algorithms for multi-hop analysis
- Network metrics computation (centrality, clustering, etc.)
- Time-series network evolution tracking

### Movement Velocity Benchmarks

**Current**: Basic growth rate and trend direction

**At Scale**:
- Compare growth, verification, and expansion rates against peer leaders
- Detect early signals of acceleration or stagnation
- Normalize growth by movement size and geography
- Predictive models for growth trajectories

**Technical Requirements**:
- Statistical analysis and percentile calculations
- Cohort analysis and normalization
- Time-series forecasting models

### Strategic Scenario Modeling (Carefully)

**Current**: Static metrics and projections

**At Scale**:
- "What if" simulations (e.g., +50 verified voters in District X)
- Time-to-critical-mass estimates for target jurisdictions
- Verification conversion forecasting based on cohort behavior
- Resource allocation optimization (where to invest verification efforts)

**Technical Requirements**:
- Monte Carlo simulation framework
- Optimization algorithms (linear programming, etc.)
- A/B testing infrastructure for validating models

## What would you build next — and why?

### 1. Database & Materialized Metrics

**Why**: Enables scale, real-time updates, and reliable performance. Without this, the dashboard cannot support production use.

**What**:
- PostgreSQL migration with proper indexing
- Materialized views for core metrics
- Incremental update jobs
- Caching layer (Redis)


### 2. Workflow Integration

**Why**: Turns insights into execution. The dashboard tells leaders what to do—now we need to help them do it.

**What**:
- One-click voter guide creation from prioritized races
- Jurisdiction-specific messaging and verification campaigns
- Task tracking tied to "This Week's Focus"
- Export capabilities (CSV, PDF reports)


### 3. Historical & Comparative Trends

**Why**: Learning loops for organizers. Leaders need to see what works over time.

**What**:
- Multi-month metric histories
- Annotations for major campaigns or events
- Comparative analysis (this month vs. last month)
- Trend visualization improvements
  
### 4. Connected Leader Network View

**Why**: Support federated organizing. Leaders need to coordinate with allies.

**What**:
- Visualize organizer networks and jurisdiction expansion
- Coordinate campaigns across allied leaders
- Shared action planning
- Network health metrics

