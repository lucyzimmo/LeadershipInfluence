"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
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

  const getTrendIcon = (rate?: number) => {
    if (rate === undefined) return Minus;
    if (rate > 5) return ArrowUpRight;
    if (rate < -5) return ArrowDownRight;
    return Minus;
  };

  const getTrendColor = (rate?: number) => {
    if (rate === undefined) return "text-gray-500";
    if (rate > 5) return "text-green-600";
    if (rate < -5) return "text-red-600";
    return "text-gray-600";
  };

  const TrendIcon = getTrendIcon(weeklyGrowthRate);
  const trendColor = getTrendColor(weeklyGrowthRate);

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="pt-5 text-sm font-medium text-zinc-900">Growth trend</div>
          {weeklyGrowthRate !== undefined && (
            <div className="text-sm text-zinc-500">
              {weeklyGrowthRate > 0 ? '+' : ''}{weeklyGrowthRate.toFixed(1)}% average weekly
            </div>
          )}
        </div>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#71717a' }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717a' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px'
                }}
                labelFormatter={(value) => {
                  const date = new Date(value as string);
                  return date.toLocaleDateString();
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#18181b"
                strokeWidth={1.5}
                fill="url(#colorValue)"
                name="Verified Voters"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
