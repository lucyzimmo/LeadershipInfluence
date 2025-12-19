import type { SwayAPIResponse, CivicEngineData } from './types';

const SWAY_API_KEY = process.env.SWAY_API_KEY || '';
const GRAPHQL_ENDPOINT = 'https://sway-production.hasura.app/v1/graphql';
const AUTH_ENDPOINT = 'https://www.sway.co/api/auth/token';

// JWT cache
let cachedJWT: string | null = null;
let jwtExpiry: number | null = null;

/**
 * Get or refresh JWT token
 */
async function getJWT(): Promise<string | null> {
  // Return cached JWT if still valid
  if (cachedJWT && jwtExpiry && Date.now() < jwtExpiry) {
    return cachedJWT;
  }

  // Don't attempt if no API key
  if (!SWAY_API_KEY) {
    console.warn('SWAY_API_KEY not configured, API features disabled');
    return null;
  }

  try {
    // Exchange API key for JWT
    const response = await fetch(AUTH_ENDPOINT, {
      headers: {
        'x-api-key': SWAY_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.statusText}`);
    }

    const { token } = await response.json();
    cachedJWT = token;
    // JWT valid for 3 days, cache for 2.5 days to be safe
    jwtExpiry = Date.now() + 2.5 * 24 * 60 * 60 * 1000;

    return token;
  } catch (error) {
    console.error('Failed to get JWT:', error);
    return null;
  }
}

/**
 * Query the Sway GraphQL API
 */
export async function querySwayAPI<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T | null> {
  const jwt = await getJWT();
  if (!jwt) {
    console.warn('No JWT available, skipping API query');
    return null;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result: SwayAPIResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Failed to query Sway API:', error);
    return null;
  }
}

/**
 * Fetch CivicEngine data for given geo IDs
 */
export async function fetchCivicEngineData(
  geoIds: string[]
): Promise<CivicEngineData | null> {
  if (geoIds.length === 0) {
    return null;
  }

  const query = `
    query GetElectoralContext($geoIds: [String!]!) {
      CivicEngine {
        positions(filterBy: { geoId: $geoIds }, first: 50) {
          nodes {
            id
            name
            level
            races {
              id
              electionDay
              candidacies {
                person {
                  firstName
                  lastName
                  party
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await querySwayAPI<{ CivicEngine: CivicEngineData }>(query, {
    geoIds,
  });

  return result?.CivicEngine || null;
}

/**
 * Fetch top leaders by supporter count for comparison
 */
export async function fetchTopLeaders(limit: number = 50): Promise<any[] | null> {
  const query = `
    query GetTopLeaders($limit: Int!) {
      profiles(
        where: {
          profileViewpointGroupRels: {
            type: { _eq: LEADER }
          }
        }
        limit: $limit
      ) {
        id
        displayNameLong
        personId
        profileViewpointGroupRels(where: { type: { _eq: LEADER } }) {
          viewpointGroup {
            id
            title
            profileViewpointGroupRels {
              id
              type
              profile {
                id
                personId
              }
            }
          }
        }
      }
    }
  `;

  const result = await querySwayAPI<{
    profiles: any[];
  }>(query, { limit });

  if (!result?.profiles) {
    return null;
  }

  // Transform data - basic structure only
  // Note: Verification metrics should be calculated from static data
  // as the API doesn't expose voter_verifications table
  const leaders = result.profiles.map(profile => {
    // Count viewpoints as the number of viewpoint groups they lead
    const totalViewpoints = profile.profileViewpointGroupRels?.length || 0;
    const groupCount = profile.profileViewpointGroupRels?.length || 0;

    // Get all supporters across all groups
    const allSupporterPersonIds = new Set<string>();

    profile.profileViewpointGroupRels?.forEach((rel: any) => {
      rel.viewpointGroup?.profileViewpointGroupRels?.forEach((supporterRel: any) => {
        if (supporterRel.profile?.personId) {
          allSupporterPersonIds.add(supporterRel.profile.personId);
        }
      });
    });

    const totalSupporters = allSupporterPersonIds.size;

    const groups = profile.profileViewpointGroupRels?.map((rel: any) => ({
      id: rel.viewpointGroup?.id,
      title: rel.viewpointGroup?.title,
      supporterCount: rel.viewpointGroup?.profileViewpointGroupRels?.length || 0,
    })) || [];

    return {
      id: profile.id,
      name: profile.displayNameLong,
      slug: profile.id,
      totalSupporters,
      verifiedVoters: 0, // Calculated from static data
      verificationRate: 0, // Calculated from static data
      growthRate: 0, // Calculated from static data
      reach: 0, // Calculated from static data
      totalViewpoints,
      groupCount,
      groups,
      jurisdictions: [], // Calculated from static data
    };
  });

  // Sort by total supporters descending
  return leaders.sort((a, b) => b.totalSupporters - a.totalSupporters);
}

/**
 * Find adjacent leaders in the same jurisdictions
 */
export async function findAdjacentLeaders(
  jurisdictionIds: string[]
): Promise<any[] | null> {
  if (jurisdictionIds.length === 0) {
    return null;
  }

  // Use the top leaders function for now
  // In production, you'd filter by overlapping jurisdictions
  console.log('Adjacent leaders query would use:', jurisdictionIds);
  return await fetchTopLeaders(20);
}

/**
 * Fetch benchmark data from similar-sized groups
 * (Simplified implementation - would need actual GraphQL schema)
 */
export async function fetchBenchmarkGroups(
  supporterCount: number
): Promise<any[] | null> {
  // This would use the actual Sway API schema
  // For now, return null as we don't have the full schema
  console.log('Benchmark query would use supporter count:', supporterCount);
  return null;
}

/**
 * Fetch upcoming elections from CivicEngine API
 */
export async function fetchUpcomingElections(
  geoIds: string[]
): Promise<any[] | null> {
  if (geoIds.length === 0) {
    return null;
  }

  const query = `
    query GetUpcomingElections($geoIds: [String!]!) {
      CivicEngine {
        positions(filterBy: { geoId: $geoIds }, first: 100) {
          nodes {
            id
            name
            level
            races {
              id
              electionDay
              type
              office {
                name
                level
              }
              candidacies {
                id
                person {
                  firstName
                  lastName
                  party
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await querySwayAPI<{ CivicEngine: { positions: { nodes: any[] } } }>(query, {
    geoIds,
  });

  if (!result?.CivicEngine?.positions?.nodes) {
    return null;
  }

  // Flatten races from all positions
  const races: any[] = [];
  for (const position of result.CivicEngine.positions.nodes) {
    for (const race of position.races || []) {
      // Only include future elections
      const electionDate = new Date(race.electionDay);
      if (electionDate > new Date()) {
        races.push({
          id: race.id,
          electionDay: race.electionDay,
          office: race.office || { name: position.name, level: position.level },
          candidateCount: race.candidacies?.length || 0,
          type: race.type || 'race',
        });
      }
    }
  }

  return races;
}
