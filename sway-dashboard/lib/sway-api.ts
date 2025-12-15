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
 * Find adjacent leaders in the same jurisdictions
 * (Simplified implementation - would need actual GraphQL schema)
 */
export async function findAdjacentLeaders(
  jurisdictionIds: string[]
): Promise<any[] | null> {
  if (jurisdictionIds.length === 0) {
    return null;
  }

  // This would use the actual Sway API schema
  // For now, return null as we don't have the full schema
  console.log('Adjacent leaders query would use:', jurisdictionIds);
  return null;
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
