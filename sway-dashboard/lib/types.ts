// ============================================================================
// Static Data Models (from JSON files)
// ============================================================================

export interface ViewpointGroup {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  current_slug_id?: string;
  influence_target_notes?: string;
  is_searchable?: boolean;
  is_public?: boolean;
  direct_embedding_id?: string;
  aggregate_embedding_id?: string;
  title_embedding_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  person_id: string;
  display_name_long?: string;
  display_name_short?: string;
  bio?: string;
  extended_bio?: string;
  avatar_media_id?: string;
  header_image_id?: string;
  profile_type?: string;
  location?: string;
  is_disabled?: boolean;
  is_id_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  party_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileViewpointGroupRel {
  id: string;
  profile_id: string;
  viewpoint_group_id: string;
  type: 'leader' | 'supporter' | 'member';
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VoterVerification {
  id: string;
  person_id: string;
  id_verification_id?: string | null;
  is_fully_verified: boolean;
  has_confirmed_voted?: boolean;
  needs_manual_review?: boolean;
  id_match_needs_manual_review?: boolean;
  vv_first_name?: string;
  vv_last_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  estimated_name?: string;
  type?: 'county' | 'city' | 'district' | 'state' | 'federal';
  level?: string | null;
  state?: string;
  geoid?: string;
  mtfcc?: string;
  geo_id?: string;
  parent_jurisdiction_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoterVerificationJurisdictionRel {
  id: string;
  voter_verification_id: string;
  jurisdiction_id: string;
  created_at?: string;
}

export interface Election {
  id: string;
  name: string;
  poll_date: string;
  civic_engine_id?: string;
  jurisdiction_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BallotItem {
  id: string;
  election_id: string;
  title?: string;
  type?: 'race' | 'measure';
  race_id?: string;
  measure_id?: string;
  jurisdiction_id?: string;
  num_selections_max?: number;
  num_winners?: number;
  is_ranked_choice?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BallotItemOption {
  id: string;
  ballot_item_id: string;
  title?: string;
  text?: string;
  candidacy_id?: string;
  option_type?: 'yes' | 'no' | 'candidate';
  created_at?: string;
  updated_at?: string;
}

export interface Race {
  id: string;
  office_term_id: string;
  ballot_item_id?: string;
  party_id?: string | null;
  is_partisan?: boolean;
  is_primary?: boolean;
  is_recall?: boolean;
  is_runoff?: boolean;
  is_off_schedule?: boolean;
  civic_engine_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Candidacy {
  id: string;
  person_id: string;
  race_id: string;
  party_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Office {
  id: string;
  name: string;
  level: 'local' | 'state' | 'federal';
  jurisdiction_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfficeTerm {
  id: string;
  office_id: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Measure {
  id: string;
  name?: string | null;
  title: string;
  description?: string;
  summary?: string;
  full_text?: string | null;
  con_snippet?: string | null;
  pro_snippet?: string | null;
  ballot_item_id?: string;
  influence_target_id?: string;
  jurisdiction_id?: string;
  civic_engine_id?: string;
  direct_embedding_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InfluenceTarget {
  id: string;
  name?: string;
  description?: string;
  jurisdiction_id?: string;
  type?: string;
  civic_engine_id?: string;
  direct_embedding_id?: string;
  aggregate_embedding_id?: string;
  title_embedding_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Party {
  id: string;
  name: string;
  abbreviation?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Computed Metrics Models
// ============================================================================

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface VerifiedVoterMetrics {
  current: number;
  verificationRate: number;
  growthTrend: TimeSeriesPoint[];
  weeklyGrowthRate?: number;
}

export interface JurisdictionConcentration {
  topJurisdictions: Array<{
    id: string;
    name: string;
    type: string;
    geoid?: string;
    verifiedCount: number;
    supporterCount: number;
    percentage: number;
    supporterPercentage: number;
  }>;
  allJurisdictions: Array<{
    id: string;
    name: string;
    type: string;
    geoid?: string;
    verifiedCount: number;
    supporterCount: number;
    percentage: number;
    supporterPercentage: number;
  }>;
  concentrationIndex: number; // HHI (0-1)
  totalJurisdictions: number;
}

export type UrgencyLevel = 'high' | 'medium' | 'low';
export type LeverageLevel = 'kingmaker' | 'significant' | 'marginal';
export type OfficeLevel = 'local' | 'state' | 'federal';

export interface BallotExposure {
  ballotItem: {
    id: string;
    title: string;
    type: 'race' | 'measure';
    electionDate: string;
    officeLevel?: OfficeLevel;
    officeName?: string;
    candidateCount?: number;
  };
  verifiedSupporters: number;
  potentialSupporters?: number;
  urgency: UrgencyLevel;
  leverageScore: number;
  leverageLevel?: LeverageLevel;
  jurisdiction?: string;
  jurisdictionId?: string;
}

export interface BallotItemInfluence {
  id: string;
  title: string;
  type: 'race' | 'measure';
  electionId: string;
  electionName: string;
  electionDate: string;
  jurisdiction: string;
  jurisdictionId?: string;
  state?: string;
  supporters: number;
  verifiedSupporters: number;
  urgency: UrgencyLevel;
  officeLevel?: OfficeLevel;
  officeName?: string;
  candidateCount?: number;
  candidates?: Array<{
    name: string;
    party?: string;
  }>;
  measureSummary?: string;
  measureProSnippet?: string;
  measureConSnippet?: string;
  numWinners?: number;
  numSelectionsMax?: number;
  isRankedChoice?: boolean;
  isPrimary?: boolean;
  isRunoff?: boolean;
  isRecall?: boolean;
}

export interface NetworkExpansion {
  connectedLeaders: number;
  newJurisdictions: number;
  trend: TimeSeriesPoint[];
  potentialLeaders?: number; // Supporters who could become leaders
}

// ============================================================================
// API-Enhanced Models
// ============================================================================

export type Competitiveness = 'safe' | 'lean' | 'tossup';

export interface ElectoralLandscape {
  ballotItem: BallotExposure['ballotItem'];
  competitiveness: Competitiveness;
  candidateCount: number;
  yourLeverage: LeverageLevel;
  verifiedSupporters: number;
}

export interface CoalitionOpportunity {
  leaderName: string;
  groupId: string;
  supporterCount: number;
  sharedJurisdictions: string[];
  sharedBallotItems: number;
  synergyScore: number;
}

export type TrendDirection = 'accelerating' | 'steady' | 'slowing';

export interface MovementVelocity {
  yourGrowthRate: number;
  peerMedian?: number;
  percentile?: number;
  trendDirection: TrendDirection;
  projection: {
    in30Days: number;
    in90Days: number;
  };
}

// ============================================================================
// Actionable Insights
// ============================================================================

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface ActionableInsight {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  metric: string;
  action: string;
  impact: ImpactLevel;
}

// ============================================================================
// Complete Dashboard Model
// ============================================================================

export interface LeaderData {
  id: string;
  name: string;
  slug: string;
  totalSupporters: number;
  verifiedVoters: number;
  verificationRate: number;
  growthRate: number;
  reach: number;
  totalViewpoints: number;
  groupCount: number;
  groups?: Array<{
    id: string;
    title: string;
    supporterCount: number;
  }>;
  jurisdictions?: string[];
}

export interface SupporterEngagement {
  totalSupporters: number;
  recentJoiners30d: number;
  recentJoiners90d: number;
  recentVerificationRate: number;
  engagementScore: number | null;
}

export interface TopicMetrics {
  supporterCount: number;
  verifiedVoterCount: number;
  leaderCount: number;
  recentJoiners30d: number;
  recentJoiners90d: number;
  topJurisdictions: Array<{
    id: string;
    name: string;
    verifiedCount: number;
  }>;
  createdDate?: string;
  updatedDate?: string;
}

export interface DashboardModel {
  summary: {
    verifiedVoters: number;
    verificationRate: number;
    connectedLeaders: number;
    viewpoints?: number;
    topics?: string[];
    topicSupporterCounts?: Record<string, number>;
    topicVerifiedVoterCounts?: Record<string, number>;
    topicMetrics?: Record<string, TopicMetrics>;
    growthRate?: number;
    reach?: number;
    jurisdictions?: string[];
    lastUpdated: string;
  };
  focusThisWeek: ActionableInsight[];
  verifiedVoters: VerifiedVoterMetrics;
  jurisdictions: JurisdictionConcentration;
  ballotExposure: BallotExposure[];
  ballotItemsInfluence?: BallotItemInfluence[];
  networkExpansion: NetworkExpansion;
  supporterEngagement: SupporterEngagement;
  electoralLandscape?: ElectoralLandscape[];
  coalitionOpportunities?: CoalitionOpportunity[];
  velocity?: MovementVelocity;
  leaderComparison?: LeaderData[];
  viewpointGroups?: ViewpointGroup[];
}

// ============================================================================
// Sway API Models
// ============================================================================

export interface SwayAPIResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    path?: string[];
  }>;
}

export interface CivicEnginePosition {
  id: string;
  name: string;
  level: string;
  races?: Array<{
    id: string;
    electionDay: string;
    candidacies?: Array<{
      person: {
        firstName: string;
        lastName: string;
        party?: string;
      };
    }>;
  }>;
}

export interface CivicEngineData {
  positions: {
    nodes: CivicEnginePosition[];
  };
}

// ============================================================================
// Static Data Container
// ============================================================================

export interface SwayStaticData {
  viewpointGroups: ViewpointGroup[];
  profiles: Profile[];
  persons: Person[];
  profileViewpointGroupRels: ProfileViewpointGroupRel[];
  voterVerifications: VoterVerification[];
  jurisdictions: Jurisdiction[];
  voterVerificationJurisdictionRels: VoterVerificationJurisdictionRel[];
  elections: Election[];
  ballotItems: BallotItem[];
  ballotItemOptions: BallotItemOption[];
  races: Race[];
  candidacies: Candidacy[];
  offices: Office[];
  officeTerms: OfficeTerm[];
  measures: Measure[];
  influenceTargets: InfluenceTarget[];
  parties: Party[];
}
