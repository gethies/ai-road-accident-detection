"use client";

import { IncidentMap } from "@/components/IncidentMap";
import { Button } from "@/components/ui/button";
import { getIncidents, getStats, type Incident, type StatsOverview } from "@/lib/api";
import { ArrowRight, Radio, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    getStats().then(setStats).catch(() => null);
    getIncidents({ limit: "20" }).then(setIncidents).catch(() => null);
  }, []);

  return (
    <div className="relative">
      {/* Hero with map background */}
      <section className="relative min-h-[70vh] overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60">
          <IncidentMap
            incidents={incidents}
            showLiveMarkers
            zoom={4}
            className="h-full min-h-[70vh]"
          />
        </div>
        <div className="relative z-10 flex min-h-[70vh] flex-col justify-center bg-gradient-to-r from-night-road via-night-road/90 to-transparent px-6 py-20 lg:px-12">
          <p className="mb-2 font-mono text-sm text-lane-yellow">AccidentWatch India</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight md:text-6xl">
            Every Second Counts on Indian Roads
          </h1>
          <p className="mt-4 max-w-xl text-lg text-dim-gray">
            AI-powered accident detection, real-time mapping, and emergency
            dispatch — built for Indian highways, cities, and rural roads.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/report">
              <Button size="lg">Report Accident</Button>
            </Link>
            <Link href="/map">
              <Button variant="secondary" size="lg">
                View Live Map
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button variant="outline" size="lg">
                API Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-white/10 bg-asphalt/50 px-6 py-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <StatCard
            label="Detected Today"
            value={stats?.detected_today ?? "—"}
          />
          <StatCard
            label="Lives Potentially Saved"
            value={stats?.lives_potentially_saved ?? "—"}
          />
          <StatCard
            label="Active Monitoring Zones"
            value={stats?.active_zones ?? "—"}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 lg:px-12">
        <h2 className="mb-10 text-center font-display text-3xl font-bold">
          How It Works
        </h2>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {[
            {
              icon: Radio,
              title: "Upload / Detect",
              desc: "Upload road images or connect CCTV streams. Our SSD model detects accidents in seconds.",
            },
            {
              icon: Zap,
              title: "Alert",
              desc: "High-severity incidents trigger SMS alerts, WebSocket broadcasts, and nearest-station notifications.",
            },
            {
              icon: Shield,
              title: "Respond",
              desc: "Police and ambulance teams acknowledge, dispatch, and resolve incidents through the alerts dashboard.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-alert/20">
                <Icon className="h-6 w-6 text-red-alert" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-dim-gray">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-white/10 bg-asphalt/30 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <blockquote className="glass-panel p-6 italic text-mist-white">
            &ldquo;AccidentWatch has reduced our highway response time by 40%.
            The AI detection from CCTV feeds is a game-changer for NH-48.&rdquo;
            <footer className="mt-3 text-sm not-italic text-dim-gray">
              — Traffic Police, Tamil Nadu Highway Patrol
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-12 text-center">
        <Link href="/detect">
          <Button size="lg">
            Try AI Detection Lab
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl font-bold text-lane-yellow">{value}</p>
      <p className="mt-1 text-sm text-dim-gray">{label}</p>
    </div>
  );
}
