
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
