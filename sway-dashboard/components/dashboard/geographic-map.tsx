"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { JurisdictionConcentration } from "@/lib/types";

interface GeographicMapProps {
  data: JurisdictionConcentration;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// State FIPS code to name mapping
const STATE_NAMES: Record<string, string> = {
  "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
  "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
  "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
  "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
  "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
  "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
  "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
  "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
  "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
  "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
  "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
  "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
  "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming", "72": "Puerto Rico"
};

export function GeographicMap({ data }: GeographicMapProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showAllSupporters, setShowAllSupporters] = useState(false);

  const jurisdictions = data.allJurisdictions?.length
    ? data.allJurisdictions
    : data.topJurisdictions;

  // Aggregate jurisdictions by state (use state-level data only, don't sum districts)
  const stateData = useMemo(() => {
    const states = new Map<string, { name: string; count: number; percentage: number }>();

    // First pass: Add all state-level jurisdictions
    jurisdictions.forEach(jurisdiction => {
      if (jurisdiction.type === 'state') {
        const count = showAllSupporters ? jurisdiction.supporterCount : jurisdiction.verifiedCount;
        const percentage = showAllSupporters ? jurisdiction.supporterPercentage : jurisdiction.percentage;
        states.set(jurisdiction.name, {
          name: jurisdiction.name,
          count,
          percentage,
        });
      }
    });

    return states;
  }, [jurisdictions, showAllSupporters]);

  const maxCount = useMemo(() => {
    return Math.max(...Array.from(stateData.values()).map(s => s.count), 1);
  }, [stateData]);

  const getColor = (geo: any) => {
    const stateName = geo.properties.name;
    const stateInfo = stateData.get(stateName);

    if (!stateInfo) return "#f0f0f0";

    // Color gradient from light blue to dark blue
    const intensity = stateInfo.count / maxCount;
    const hue = 210; // Blue hue
    const saturation = 70;
    const lightness = 85 - (intensity * 50); // From 85% (light) to 35% (dark)

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleStateClick = (geo: any) => {
    const stateName = geo.properties.name;
    setSelectedState(stateName === selectedState ? null : stateName);
  };

  // Get districts for selected state
  const selectedStateDistricts = useMemo(() => {
    if (!selectedState) return [];

    // Find the state jurisdiction to get its geoid/name
    const stateJurisdiction = jurisdictions.find(
      j => j.type === 'state' && j.name === selectedState
    );

    if (!stateJurisdiction) return [];

    // Filter districts that belong to this state
    // Districts can be identified by:
    // 1. Name starts with state name
    // 2. Geoid starts with state geoid (2-digit)
    // 3. Type is district
    return jurisdictions.filter(j => {
      if (j.type === 'state' || j.name === selectedState) return false;
      
      // Check if name starts with state name
      if (j.name.startsWith(selectedState)) return true;
      
      // Check if geoid starts with state geoid (for 2-digit state FIPS)
      if (stateJurisdiction.geoid && j.geoid && j.geoid.startsWith(stateJurisdiction.geoid)) {
        return true;
      }
      
      return false;
    }).sort((a, b) => {
      const countA = showAllSupporters ? a.supporterCount : a.verifiedCount;
      const countB = showAllSupporters ? b.supporterCount : b.verifiedCount;
      return countB - countA;
    });
  }, [selectedState, jurisdictions, showAllSupporters]);

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="pt-5 text-sm font-medium text-zinc-900">Geographic concentration</div>
          <div className="text-sm text-zinc-500">
            {showAllSupporters ? "All supporters" : "Verified voters"} distribution across states
            {selectedState && ` - ${selectedState} districts`}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setShowAllSupporters(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              !showAllSupporters
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            Verified voters
          </button>
          <button
            onClick={() => setShowAllSupporters(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              showAllSupporters
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            All supporters
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white border border-zinc-200/70 rounded-lg p-4 flex flex-col">
            <div className="flex-1 min-h-[400px] max-h-[600px] overflow-hidden">
              <ComposableMap projection="geoAlbersUsa" className="w-full h-full">
                <ZoomableGroup>
                  <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo: any) => {
                        const stateName = geo.properties.name;
                        const stateInfo = stateData.get(stateName);
                        const isSelected = stateName === selectedState;

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getColor(geo)}
                            stroke={isSelected ? "#3b82f6" : "#e5e7eb"}
                            strokeWidth={isSelected ? 2 : 0.5}
                            style={{
                              default: { outline: "none" },
                              hover: {
                                fill: stateInfo ? "#3b82f6" : "#f0f0f0",
                                outline: "none",
                                cursor: stateInfo ? "pointer" : "default",
                              },
                              pressed: { outline: "none" },
                            }}
                            onClick={() => stateInfo && handleStateClick(geo)}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2 flex-shrink-0">
              <span className="text-xs text-zinc-500">Fewer</span>
              <div className="flex gap-1">
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => {
                  const hue = 210;
                  const saturation = 70;
                  const lightness = 85 - (intensity * 50);
                  return (
                    <div
                      key={intensity}
                      className="w-8 h-4 border border-zinc-200"
                      style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-zinc-500">More</span>
            </div>
          </div>

          {/* State/District List */}
          <div className="bg-white border border-zinc-200/70 rounded-lg p-4 flex flex-col h-full min-h-[400px] max-h-[600px]">
            <div className="text-sm font-medium text-zinc-900 mb-3 flex-shrink-0">
              {selectedState ? `${selectedState} Districts` : "All States"}
            </div>

            {selectedState && selectedStateDistricts.length > 0 ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {selectedStateDistricts.map((district, idx) => (
                    <div
                      key={district.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/70 flex-shrink-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate">
                          {district.name.replace(selectedState, '').trim() || district.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {district.type}
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="text-sm font-semibold text-zinc-900">
                          {showAllSupporters ? district.supporterCount : district.verifiedCount}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {(showAllSupporters ? district.supporterPercentage : district.percentage).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedState(null)}
                  className="w-full mt-3 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex-shrink-0"
                >
                  ← Back to all states
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {Array.from(stateData.entries())
                    .sort(([, a], [, b]) => b.count - a.count)
                    .map(([stateName, info], idx) => (
                      <div
                        key={stateName}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/70 cursor-pointer hover:bg-zinc-100 transition-colors flex-shrink-0"
                        onClick={() => setSelectedState(stateName)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-6 text-xs font-medium text-zinc-500">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-900">
                              {stateName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-sm font-semibold text-zinc-900">
                            {info.count}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {info.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {selectedState && selectedStateDistricts.length === 0 && (
              <div className="flex flex-col flex-1 items-center justify-center py-8">
                <p className="text-sm text-zinc-500 mb-3">No district data for {selectedState}</p>
                <button
                  onClick={() => setSelectedState(null)}
                  className="px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
                >
                  ← Back to all states
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
