"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/types";

interface GrowthChartProps {
  data: TimeSeriesPoint[];
  weeklyGrowthRate?: number;
}

export function GrowthChart({ data, weeklyGrowthRate }: GrowthChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Growth Trend</CardTitle>
        {weeklyGrowthRate !== undefined && (
          <p className="text-sm text-gray-600">
            Average weekly growth: {weeklyGrowthRate.toFixed(1)}%
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value as string);
                return date.toLocaleDateString();
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fill="#93c5fd"
              name="Verified Voters"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
