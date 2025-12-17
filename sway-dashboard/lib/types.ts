// ============================================================================
// Static Data Models (from JSON files)
// ============================================================================

export interface ViewpointGroup {
  id: string;
  name: string;
  description?: string;
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
  title: string;
  candidacy_id?: string;
  option_type?: 'yes' | 'no' | 'candidate';
  created_at?: string;
  updated_at?: string;
}

export interface Race {
  id: string;
  office_term_id: string;
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
  title: string;
  description?: string;
  jurisdiction_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InfluenceTarget {
  id: string;
  name: string;
  type: string;
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
    verifiedCount: number;
    percentage: number;
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
  urgency: UrgencyLevel;
  leverageScore: number;
  leverageLevel?: LeverageLevel;
  jurisdiction?: string;
}

export interface NetworkExpansion {
  derivativeLeaders: number;
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
  totalViewpoints: number;
  groupCount: number;
  groups?: Array<{
    id: string;
    title: string;
    supporterCount: number;
  }>;
}

export interface DashboardModel {
  summary: {
    verifiedVoters: number;
    verificationRate: number;
    derivativeLeaders: number;
    viewpoints?: number;
    topics?: string[];
    topicSupporterCounts?: Record<string, number>;
    topicVerifiedVoterCounts?: Record<string, number>;
    lastUpdated: string;
  };
  focusThisWeek: ActionableInsight[];
  verifiedVoters: VerifiedVoterMetrics;
  jurisdictions: JurisdictionConcentration;
  ballotExposure: BallotExposure[];
  networkExpansion: NetworkExpansion;
  electoralLandscape?: ElectoralLandscape[];
  coalitionOpportunities?: CoalitionOpportunity[];
  velocity?: MovementVelocity;
  leaderComparison?: LeaderData[];
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
