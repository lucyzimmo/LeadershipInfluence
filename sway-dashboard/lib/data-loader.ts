import { promises as fs } from 'fs';
import path from 'path';
import type { SwayStaticData } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Load a JSON file from the data directory
 */
async function loadJSONFile<T>(filename: string): Promise<T> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [] as T;
  }
}

/**
 * Load all static Sway data from JSON files
 * This is the main entry point for loading data
 */
export async function loadSwayData(): Promise<SwayStaticData> {
  const [
    viewpointGroups,
    profiles,
    persons,
    profileViewpointGroupRels,
    voterVerifications,
    jurisdictions,
    voterVerificationJurisdictionRels,
    elections,
    ballotItems,
    ballotItemOptions,
    races,
    candidacies,
    offices,
    officeTerms,
    measures,
    influenceTargets,
    parties,
  ] = await Promise.all([
    loadJSONFile('viewpoint_groups.json'),
    loadJSONFile('profiles.json'),
    loadJSONFile('persons.json'),
    loadJSONFile('profile_viewpoint_group_rels.json'),
    loadJSONFile('voter_verifications.json'),
    loadJSONFile('jurisdictions.json'),
    loadJSONFile('voter_verification_jurisdiction_rels.json'),
    loadJSONFile('elections.json'),
    loadJSONFile('ballot_items.json'),
    loadJSONFile('ballot_item_options.json'),
    loadJSONFile('races.json'),
    loadJSONFile('candidacies.json'),
    loadJSONFile('offices.json'),
    loadJSONFile('office_terms.json'),
    loadJSONFile('measures.json'),
    loadJSONFile('influence_targets.json'),
    loadJSONFile('parties.json'),
  ]);

  return {
    viewpointGroups,
    profiles,
    persons,
    profileViewpointGroupRels,
    voterVerifications,
    jurisdictions,
    voterVerificationJurisdictionRels,
    elections,
    ballotItems,
    ballotItemOptions,
    races,
    candidacies,
    offices,
    officeTerms,
    measures,
    influenceTargets,
    parties,
  };
}

/**
 * Get the main viewpoint group ID (the leader's coalition)
 * In production, this would be passed as a parameter
 */
export const MAIN_GROUP_ID = '4d627244-5598-4403-8704-979140ae9cac';
