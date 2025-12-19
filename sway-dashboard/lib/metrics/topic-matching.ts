import type { BallotItemInfluence, ViewpointGroup } from '../types';

/**
 * Extract location keywords from text (cities, states, abbreviations)
 */
function extractLocationKeywords(text: string): Set<string> {
  const locationKeywords = new Set<string>();
  const lowerText = text.toLowerCase();
  
  // Common city/state abbreviations and names
  const locationPatterns = [
    // State abbreviations
    /\b(ca|ny|tx|fl|il|pa|oh|ga|nc|mi|nj|va|wa|az|ma|tn|in|mo|md|wi|co|mn|sc|al|la|ky|or|ok|ct|ut|ia|ar|nv|ms|ks|nm|ne|wv|id|hi|nh|me|ri|mt|de|sd|nd|ak|vt|wy|dc)\b/g,
    // Common city abbreviations
    /\b(sf|nyc|la|chi|phx|hou|phil|san|san\s+francisco|new\s+york|los\s+angeles|chicago|phoenix|houston|philadelphia|seattle|boston|miami|atlanta|dallas|detroit|minneapolis|portland|denver|baltimore|milwaukee|kansas\s+city|columbus|cleveland|indianapolis|nashville|charlotte|raleigh|memphis|oklahoma\s+city|louisville|portland|las\s+vegas|virginia\s+beach|arlington|tampa|new\s+orleans|honolulu|omaha|oakland|minneapolis|tulsa|cleveland|wichita|arlington|bakersfield|tampa|aurora|new\s+orleans|honolulu|anaheim|santa\s+ana|st\s+louis|riverside|corpus\s+christi|lexington|stockton|henderson|saint\s+paul|st\s+paul|st\s+louis|chula\s+vista|jersey\s+city|fremont|chandler|buffalo|durham|santa\s+rosa|irvine|san\s+bernardino|san\s+antonio|modesto|fontana|oxnard|moreno\s+valley|huntington\s+beach|glendale|santa\s+clarita|grand\s+rapids|winston\s+salem|oceanside|rancho\s+cucamonga|santa\s+clara|ontario|vancouver|sioux\s+falls|peoria|frisco|cary|elk\s+grove|salem|pembroke\s+pines|corona|eugene|fort\s+wayne|mckinney|fayetteville|lexington|santa\s+ana|ann\s+arbor|independence|visalia|simi\s+valley|thousand\s+oaks|concord|roseville|lakewood|thornton|olathe|carrollton|midland|surprise|sterling\s+heights|waco|gainesville|cape\s+coral|evansville|vallejo|aberdeen|warren|palmdale|peoria|richmond|fullerton|norman|corvallis|berkeley|round\s+rock|downey|costa\s+mesa|inglewood|ventura|west\s+valley\s+city|waterbury|boulder|santa\s+barbara|allentown|el\s+cajon|richmond|billings|compton|broken\s+arrow|south\s+bend|lewisville|davie|league\s+city|tyler|lawton|san\s+mateo|burbank|kenosha|greeley|daly\s+city|green\s+bay|waukegan|boca\s+raton|battle\s+creek|santa\s+monica|south\s+gate|lawrence|norwalk|gary|santa\s+cruz|watsonville|el\s+centro|san\s+luis\s+obispo|san\s+rafael|san\s+bruno|san\s+carlos|san\s+leandro|san\s+lorenzo|san\s+mateo|san\s+pablo|san\s+ramon|saratoga|sausalito|sebastopol|sonoma|south\s+lake\s+tahoe|south\s+pasadena|stockton|sunnyvale|susanville|tiburon|torrance|tracy|tulare|turlock|tustin|union\s+city|upland|vacaville|vallejo|ventura|victorville|visalia|vista|walnut\s+creek|watsonville|west\s+covina|west\s+hollywood|west\s+sacramento|westminster|whittier|woodland|yorba\s+linda|yuba\s+city|yucaipa|yucca\s+valley)\b/g,
  ];
  
  // Extract state abbreviations
  const stateAbbrevMatch = lowerText.match(/\b(ca|ny|tx|fl|il|pa|oh|ga|nc|mi|nj|va|wa|az|ma|tn|in|mo|md|wi|co|mn|sc|al|la|ky|or|ok|ct|ut|ia|ar|nv|ms|ks|nm|ne|wv|id|hi|nh|me|ri|mt|de|sd|nd|ak|vt|wy|dc)\b/g);
  if (stateAbbrevMatch) {
    stateAbbrevMatch.forEach(m => locationKeywords.add(m));
  }
  
  // Special handling for "SF" - check for it before other city matches
  // because it might appear as part of a phrase like "Make SF safe"
  if (lowerText.includes(' sf ') || lowerText.startsWith('sf ') || lowerText.endsWith(' sf') || lowerText.match(/\bsf\b/)) {
    locationKeywords.add('sf');
    locationKeywords.add('san francisco');
    locationKeywords.add('ca');
  }
  
  // Extract common city names and abbreviations
  const cityMatches = lowerText.match(/\b(sf|nyc|san\s+francisco|new\s+york|los\s+angeles|chicago|seattle|boston|miami|atlanta|dallas|detroit|phoenix|houston|philadelphia|minneapolis|portland|denver|baltimore|milwaukee|kansas\s+city|columbus|cleveland|indianapolis|nashville|charlotte|raleigh|memphis|oklahoma\s+city|louisville|las\s+vegas|virginia\s+beach|arlington|tampa|new\s+orleans|honolulu|omaha|oakland|tulsa|wichita|bakersfield|aurora|anaheim|santa\s+ana|st\s+louis|riverside|corpus\s+christi|lexington|stockton|henderson|saint\s+paul|chula\s+vista|jersey\s+city|fremont|chandler|buffalo|durham|santa\s+rosa|irvine|san\s+bernardino|san\s+antonio|modesto|fontana|oxnard|moreno\s+valley|huntington\s+beach|glendale|santa\s+clarita|grand\s+rapids|winston\s+salem|oceanside|rancho\s+cucamonga|santa\s+clara|ontario|vancouver|sioux\s+falls|peoria|frisco|cary|elk\s+grove|salem|pembroke\s+pines|corona|eugene|fort\s+wayne|mckinney|fayetteville|ann\s+arbor|independence|visalia|simi\s+valley|thousand\s+oaks|concord|roseville|lakewood|thornton|olathe|carrollton|midland|surprise|sterling\s+heights|waco|gainesville|cape\s+coral|evansville|vallejo|aberdeen|warren|palmdale|richmond|fullerton|norman|corvallis|berkeley|round\s+rock|downey|costa\s+mesa|inglewood|ventura|west\s+valley\s+city|waterbury|boulder|santa\s+barbara|allentown|el\s+cajon|billings|compton|broken\s+arrow|south\s+bend|lewisville|davie|league\s+city|tyler|lawton|san\s+mateo|burbank|kenosha|greeley|daly\s+city|green\s+bay|waukegan|boca\s+raton|battle\s+creek|santa\s+monica|south\s+gate|lawrence|norwalk|gary|santa\s+cruz|watsonville|el\s+centro|san\s+luis\s+obispo|san\s+rafael|san\s+bruno|san\s+carlos|san\s+leandro|san\s+lorenzo|san\s+pablo|san\s+ramon|saratoga|sausalito|sebastopol|sonoma|south\s+lake\s+tahoe|south\s+pasadena|sunnyvale|susanville|tiburon|torrance|tracy|tulare|turlock|tustin|union\s+city|upland|vacaville|victorville|vista|walnut\s+creek|west\s+covina|west\s+hollywood|west\s+sacramento|westminster|whittier|woodland|yorba\s+linda|yuba\s+city|yucaipa|yucca\s+valley)\b/g);
  if (cityMatches) {
    cityMatches.forEach(m => {
      locationKeywords.add(m);
      // Also add common abbreviations
      if (m === 'san francisco' || m === 'sf') {
        locationKeywords.add('sf');
        locationKeywords.add('san francisco');
        locationKeywords.add('ca');
      }
      if (m === 'new york' || m === 'nyc') {
        locationKeywords.add('nyc');
        locationKeywords.add('new york');
        locationKeywords.add('ny');
      }
    });
  }
  
  return locationKeywords;
}

/**
 * Check if ballot item matches topic's geographic scope
 */
function checkGeographicMatch(
  topicLocations: Set<string>,
  ballotItemJurisdiction: string,
  ballotItemState?: string
): { matches: boolean; penalty: number } {
  if (topicLocations.size === 0) {
    // No location specified in topic, no geographic filtering
    return { matches: true, penalty: 0 };
  }
  
  const itemText = `${ballotItemJurisdiction} ${ballotItemState || ''}`.toLowerCase();
  
  // Check if any topic location appears in ballot item
  for (const location of topicLocations) {
    if (itemText.includes(location)) {
      return { matches: true, penalty: 0 }; // Geographic match, no penalty
    }
  }
  
  // No geographic match - apply penalty
  // If topic mentions a specific location, heavily penalize non-matching items
  return { matches: false, penalty: 0.8 }; // 80% penalty for geographic mismatch
}

/**
 * Calculate relevance score between a topic and a ballot item
 * Uses keyword matching and semantic similarity with geographic filtering
 */
export function calculateTopicRelevance(
  topic: ViewpointGroup,
  ballotItem: BallotItemInfluence
): number {
  const topicTitle = (topic.title || '').toLowerCase();
  const topicDescription = (topic.description || '').toLowerCase();
  const topicText = `${topicTitle} ${topicDescription}`.trim();
  
  if (!topicText) return 0;
  
  // Extract location keywords from topic
  const topicLocations = extractLocationKeywords(topicText);
  
  // Check geographic match
  const geoMatch = checkGeographicMatch(
    topicLocations,
    ballotItem.jurisdiction,
    ballotItem.state
  );
  
  // If topic specifies a location and ballot item doesn't match, heavily penalize
  if (!geoMatch.matches && topicLocations.size > 0) {
    return 0; // Completely filter out geographic mismatches
  }
  
  const itemTitle = ballotItem.title.toLowerCase();
  const itemOfficeName = (ballotItem.officeName || '').toLowerCase();
  const itemSummary = (ballotItem.measureSummary || '').toLowerCase();
  const itemJurisdiction = ballotItem.jurisdiction.toLowerCase();
  const itemText = `${itemTitle} ${itemOfficeName} ${itemSummary} ${itemJurisdiction}`.trim();
  
  // Extract keywords from topic
  const topicKeywords = extractKeywords(topicText);
  const itemKeywords = extractKeywords(itemText);
  
  if (topicKeywords.size === 0) return 0;
  
  // Calculate keyword overlap score
  let keywordScore = 0;
  const matchedKeywords = new Set<string>();
  
  for (const keyword of topicKeywords) {
    // Exact match
    if (itemKeywords.has(keyword)) {
      keywordScore += 2;
      matchedKeywords.add(keyword);
    } else {
      // Partial matches
      for (const itemKeyword of itemKeywords) {
        if (itemKeyword.includes(keyword) || keyword.includes(itemKeyword)) {
          keywordScore += 1;
          matchedKeywords.add(keyword);
          break;
        }
      }
    }
  }
  
  // Normalize by topic keyword count
  const normalizedKeywordScore = Math.min(keywordScore / (topicKeywords.size * 2), 1.0);
  
  // Check for exact phrase matches (higher weight)
  let phraseScore = 0;
  const topicPhrases = extractPhrases(topicText);
  for (const phrase of topicPhrases) {
    if (itemText.includes(phrase)) {
      phraseScore += 1;
    }
  }
  const normalizedPhraseScore = Math.min(phraseScore / Math.max(topicPhrases.length, 1), 1.0);
  
  // Check for title match (very high weight)
  let titleMatchScore = 0;
  if (topicTitle && itemTitle.includes(topicTitle)) {
    titleMatchScore = 1.0;
  } else if (topicTitle) {
    // Check if topic title words appear in item title
    const topicTitleWords = extractKeywords(topicTitle);
    let titleWordMatches = 0;
    for (const word of topicTitleWords) {
      if (itemTitle.includes(word)) {
        titleWordMatches++;
      }
    }
    if (topicTitleWords.size > 0) {
      titleMatchScore = titleWordMatches / topicTitleWords.size;
    }
  }
  
  // Combine scores with weights
  const relevanceScore = 
    titleMatchScore * 0.4 + 
    normalizedPhraseScore * 0.3 + 
    normalizedKeywordScore * 0.3;
  
  return Math.min(relevanceScore, 1.0); // Cap at 1.0
}

/**
 * Extract meaningful keywords from text (removes common words)
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return new Set(words);
}

/**
 * Extract meaningful phrases (2-3 word combinations)
 */
function extractPhrases(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  return phrases.filter(p => p.length > 5); // Only meaningful phrases
}

/**
 * Match ballot items to topics and return top opportunities
 */
export interface TopicOpportunity {
  topic: string;
  topicId: string;
  ballotItem: BallotItemInfluence;
  relevanceScore: number;
  opportunityScore: number; // Combines relevance + supporter count + urgency
}

export function findTopicOpportunities(
  topics: ViewpointGroup[],
  ballotItems: BallotItemInfluence[]
): TopicOpportunity[] {
  const opportunities: TopicOpportunity[] = [];
  
  for (const topic of topics) {
    if (!topic.title) continue;
    
    for (const ballotItem of ballotItems) {
      const relevanceScore = calculateTopicRelevance(topic, ballotItem);
      
      // Only include if relevance is above threshold
      if (relevanceScore < 0.1) continue;
      
      // Calculate opportunity score (relevance + supporter count + urgency)
      const urgencyMultiplier = {
        high: 3,
        medium: 2,
        low: 1,
      }[ballotItem.urgency];
      
      const supporterScore = Math.min(ballotItem.verifiedSupporters / 100, 1); // Normalize to 0-1
      const opportunityScore = 
        relevanceScore * 0.5 + 
        supporterScore * 0.3 + 
        (urgencyMultiplier / 3) * 0.2;
      
      opportunities.push({
        topic: topic.title,
        topicId: topic.id,
        ballotItem,
        relevanceScore,
        opportunityScore,
      });
    }
  }
  
  // Sort by opportunity score (highest first)
  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

