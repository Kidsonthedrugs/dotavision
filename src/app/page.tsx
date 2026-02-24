"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Swords, TrendingUp, Users, Shield, Target, Gamepad2, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [steamId, setSteamId] = useState("");

  const handleAnalyze = () => {
    if (steamId.trim()) {
      // Save to localStorage for dashboard to read
      localStorage.setItem("dotavision-steamid", steamId.trim());
      router.push(`/dashboard?id=${steamId.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--background-secondary)] via-[var(--background)] to-[var(--background-secondary)] p-8 md:p-12 border border-[var(--color-card-border)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-accent)_0%,_transparent_50%)] opacity-10" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)] shadow-[var(--shadow-gold)] animate-pulse-gold">
              <Swords className="h-8 w-8 text-[var(--color-background)]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-foreground)]">
              DotaVision
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-[var(--color-foreground-muted)]">
            Elite Dota 2 analytics for Immortal and Divine players. 
            Track your performance, analyze your heroes, and win more games with data-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Input
              id="steam-input"
              type="search"
              placeholder="Enter Steam ID (e.g., 123456789)"
              className="flex-1"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={handleAnalyze}
            >
              Analyze
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                <TrendingUp className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-foreground-muted)]">Win Rate</p>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">52.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-health)]/10">
                <Gamepad2 className="h-6 w-6 text-[var(--color-health)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-foreground-muted)]">Avg KDA</p>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">4.2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-mana)]/10">
                <Shield className="h-6 w-6 text-[var(--color-mana)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-foreground-muted)]">Avg GPM</p>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">542</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-warning)]/10">
                <Users className="h-6 w-6 text-[var(--color-warning)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-foreground-muted)]">Matches</p>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-6">
          Analyze. Improve. Win.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/matches">
            <Card className="h-full hover:border-[var(--color-accent)] transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]">
                    <Gamepad2 className="h-5 w-5 text-[var(--color-background)]" />
                  </div>
                  <CardTitle>Match History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View your recent matches with detailed stats, performance metrics, and lane analysis.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/heroes">
            <Card className="h-full hover:border-[var(--color-accent)] transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-health)]">
                    <Shield className="h-5 w-5 text-[var(--background)]" />
                  </div>
                  <CardTitle>Hero Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your performance on each hero, identify strengths, and discover heroes that fit your playstyle.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/roles">
            <Card className="h-full hover:border-[var(--color-accent)] transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-mana)]">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Role Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Understand your role performance, lane success rates, and optimal position preferences.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/peers">
            <Card className="h-full hover:border-[var(--color-accent)] transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-warning)]">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Party & Peers</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Analyze synergy with teammates, track party performance, and identify your best teammates.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/analytics">
            <Card className="h-full hover:border-[var(--color-accent)] transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-success)]">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Deep Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Advanced statistics, trend analysis, MMR tracking, and session summaries.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-danger)]">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Coming Soon</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered match predictions, personalized coaching tips, and hero counters.
              </CardDescription>
              <Badge variant="outline" className="mt-4">Phase 2</Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
