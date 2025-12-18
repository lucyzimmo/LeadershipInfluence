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

  // Get all states and create a map of state geoid to state name
  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    data.topJurisdictions.forEach(jurisdiction => {
      if (jurisdiction.type === 'state' && jurisdiction.geoid) {
        map.set(jurisdiction.geoid, jurisdiction.name);
      }
    });
    return map;
  }, [data]);

  // Aggregate jurisdictions by state (use state-level data only, don't sum districts)
  const stateData = useMemo(() => {
    const states = new Map<string, { name: string; count: number; percentage: number }>();

    // First pass: Add all state-level jurisdictions
    data.topJurisdictions.forEach(jurisdiction => {
      if (jurisdiction.type === 'state') {
        states.set(jurisdiction.name, {
          name: jurisdiction.name,
          count: jurisdiction.verifiedCount,
          percentage: jurisdiction.percentage,
        });
      }
    });

    // Second pass: For districts without a state entry, try to infer the state
    data.topJurisdictions.forEach(jurisdiction => {
      if (jurisdiction.type !== 'state') {
        let stateName: string | null = null;

        // Try to extract state from geoid
        if (jurisdiction.geoid && jurisdiction.geoid.length > 2) {
          const stateGeoid = jurisdiction.geoid.substring(0, 2);
          stateName = stateMap.get(stateGeoid) || null;
        }

        // Fallback: Try to extract from name
        if (!stateName) {
          const stateMatch = jurisdiction.name.match(/^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)/);
          if (stateMatch) {
            stateName = stateMatch[1];
          }
        }

        // Only add if we don't already have state-level data
        if (stateName && !states.has(stateName)) {
          const existing = states.get(stateName);
          if (existing) {
            // This shouldn't happen since we checked !states.has()
            existing.count += jurisdiction.verifiedCount;
            existing.percentage += jurisdiction.percentage;
          } else {
            states.set(stateName, {
              name: stateName,
              count: jurisdiction.verifiedCount,
              percentage: jurisdiction.percentage,
            });
          }
        }
      }
    });

    return states;
  }, [data, stateMap]);

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

    return data.topJurisdictions.filter(j =>
      j.name.startsWith(selectedState) &&
      j.name !== selectedState &&
      (j.type === 'district' || j.name.includes('District'))
    );
  }, [selectedState, data]);

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="pt-5 text-sm font-medium text-zinc-900">Geographic concentration</div>
          <div className="text-sm text-zinc-500">
            Verified voter distribution across states
            {selectedState && ` - ${selectedState} districts`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white border border-zinc-200/70 rounded-lg p-4">
            <ComposableMap projection="geoAlbersUsa">
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
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

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2">
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
          <div className="bg-white border border-zinc-200/70 rounded-lg p-4">
            <div className="text-sm font-medium text-zinc-900 mb-3">
              {selectedState ? `${selectedState} Districts` : "Top States"}
            </div>

            {selectedState && selectedStateDistricts.length > 0 ? (
              <div className="space-y-2">
                {selectedStateDistricts.map((district, idx) => (
                  <div
                    key={district.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/70"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">
                        {district.name.replace(selectedState, '').trim()}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {district.type}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-zinc-900">
                        {district.verifiedCount}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {district.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setSelectedState(null)}
                  className="w-full mt-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
                >
                  ← Back to all states
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(stateData.entries())
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 10)
                  .map(([stateName, info], idx) => (
                    <div
                      key={stateName}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/70 cursor-pointer hover:bg-zinc-100 transition-colors"
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
                      <div className="text-right ml-4">
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
            )}

            {selectedState && selectedStateDistricts.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">No district data for {selectedState}</p>
                <button
                  onClick={() => setSelectedState(null)}
                  className="mt-3 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
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
