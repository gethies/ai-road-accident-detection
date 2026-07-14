"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStats, type StatsOverview } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

const COLORS = ["#D9232D", "#F5C842", "#22C55E", "#6B7280"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => null);
  }, []);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-dim-gray">
        Loading analytics…
      </div>
    );
  }

  const peakGrid = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const cell = stats.peak_hours.find((p) => p.day === day && p.hour === hour);
      return cell?.count ?? 0;
    })
  );
  const maxPeak = Math.max(...peakGrid.flat(), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-8 font-display text-3xl font-bold">Analytics Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard title="Incidents This Week" value={stats.total_this_week} />
        <OverviewCard title="Avg Response Time" value={`${stats.avg_response_minutes} min`} />
        <OverviewCard title="Most Dangerous Hour" value={`${stats.most_dangerous_hour}:00`} />
        <OverviewCard title="Top District" value={stats.top_district} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accidents per Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.hourly_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" />
                <XAxis dataKey="hour" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1E2530", border: "none" }} />
                <Line type="monotone" dataKey="count" stroke="#F5C842" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Road Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.road_type_breakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.road_type_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1E2530", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>State-wise Density</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.state_density}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" />
                <XAxis dataKey="state" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1E2530", border: "none" }} />
                <Bar dataKey="count" fill="#D9232D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detection Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.confidence_histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" />
                <XAxis dataKey="bucket" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1E2530", border: "none" }} />
                <Bar dataKey="count" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Peak Hours Heatmap (Day × Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: "repeat(25, 1fr)" }}>
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-center text-[8px] text-dim-gray">
                    {h}
                  </div>
                ))}
                {peakGrid.map((row, day) => (
                  <div key={`row-${day}`} className="contents">
                    <div className="pr-1 text-[10px] text-dim-gray">{DAYS[day]}</div>
                    {row.map((count, hour) => (
                      <div
                        key={`${day}-${hour}`}
                        className="h-4 w-4 rounded-sm"
                        style={{
                          backgroundColor: `rgba(217, 35, 45, ${count / maxPeak})`,
                        }}
                        title={`${DAYS[day]} ${hour}:00 — ${count} incidents`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-dim-gray">{title}</p>
        <p className="mt-1 font-display text-3xl font-bold text-lane-yellow">{value}</p>
      </CardContent>
    </Card>
  );
}
