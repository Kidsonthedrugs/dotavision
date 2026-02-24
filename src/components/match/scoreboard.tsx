"use client";

import { motion } from "framer-motion";
import type { Hero } from "@/types";
import type { Match, MatchPlayer } from "@/lib/opendota";
import { formatDuration, formatKDA, formatNumber } from "@/lib/utils";

interface ScoreboardProps {
  match: Match;
  heroes: Record<number, Hero>;
  trackedAccountId?: number;
}

interface PlayerRowProps {
  player: {
    account_id: number | null;
    hero_id: number;
    kills: number;
    deaths: number;
    assists: number;
    gold_per_min: number;
    xp_per_min: number;
    last_hits: number;
    denies: number;
    net_worth: number;
    hero_damage: number;
    tower_damage: number;
    hero_healing: number;
    player_slot: number;
  };
  hero?: Hero;
  isRadiant: boolean;
  isWin: boolean;
  isTracked: boolean;
}

function PlayerRow({
  player,
  hero,
  isRadiant,
  isWin,
  isTracked,
}: PlayerRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: isRadiant ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`hover:bg-background-secondary/50 ${
        isTracked ? "bg-accent/10 border-l-2 border-l-accent" : ""
      }`}
    >
      {/* Hero */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded bg-background-tertiary overflow-hidden">
            {hero && (
              <img
                src={`https://cdn.cloudflare.steamstatic.com${hero.img}`}
                alt={hero.localizedName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="text-sm font-medium text-foreground">
            {hero?.localizedName || `Hero ${player.hero_id}`}
          </span>
          {isTracked && (
            <span className="px-1.5 py-0.5 text-[10px] bg-accent/20 text-accent rounded">
              YOU
            </span>
          )}
        </div>
      </td>

      {/* KDA */}
      <td className="px-3 py-2">
        <span className="text-sm text-foreground">
          {formatKDA(player.kills, player.deaths, player.assists)}
        </span>
      </td>

      {/* GPM/XPM */}
      <td className="px-3 py-2">
        <div className="text-sm">
          <span className="text-foreground">{player.gold_per_min}</span>
          <span className="text-foreground-muted">/</span>
          <span className="text-foreground">{player.xp_per_min}</span>
        </div>
      </td>

      {/* CS */}
      <td className="px-3 py-2">
        <div className="text-sm text-foreground-muted">
          {player.last_hits}/{player.denies}
        </div>
      </td>

      {/* Net Worth */}
      <td className="px-3 py-2">
        <span className="text-sm text-accent">
          {formatNumber(player.net_worth)}
        </span>
      </td>

      {/* Hero Damage */}
      <td className="px-3 py-2">
        <span className="text-sm text-danger">
          {formatNumber(player.hero_damage)}
        </span>
      </td>

      {/* Tower Damage */}
      <td className="px-3 py-2">
        <span className="text-sm text-warning">
          {formatNumber(player.tower_damage)}
        </span>
      </td>

      {/* Hero Healing */}
      <td className="px-3 py-2">
        <span className="text-sm text-health">
          {formatNumber(player.hero_healing)}
        </span>
      </td>
    </motion.tr>
  );
}

export function Scoreboard({
  match,
  heroes,
  trackedAccountId,
}: ScoreboardProps) {
  const radiantPlayers: MatchPlayer[] = match.players.filter(
    (p: MatchPlayer) => p.player_slot < 128
  );
  const direPlayers: MatchPlayer[] = match.players.filter(
    (p: MatchPlayer) => p.player_slot >= 128
  );
  const radiantWin = match.radiant_win;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-9 gap-2 px-4 py-3 bg-background-secondary border-b border-card-border text-xs font-medium text-foreground-muted uppercase tracking-wider">
        <div className="col-span-2">Hero</div>
        <div>KDA</div>
        <div>GPM/XPM</div>
        <div>CS</div>
        <div>Net Worth</div>
        <div>Hero Dmg</div>
        <div>Tower Dmg</div>
        <div>Healing</div>
      </div>

      {/* Radiant Team */}
      <div className="bg-health/5">
        <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
          <span className="text-sm font-medium text-health">
            Radiant {radiantWin ? "(WIN)" : ""}
          </span>
          <span className="text-xs text-foreground-muted">
            {formatDuration(match.duration)}
          </span>
        </div>
        <table className="w-full">
          <tbody>
            {radiantPlayers.map((player) => (
              <PlayerRow
                key={player.player_slot}
                player={player}
                hero={heroes[player.hero_id]}
                isRadiant={true}
                isWin={radiantWin}
                isTracked={player.account_id === trackedAccountId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Dire Team */}
      <div className="bg-danger/5">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-sm font-medium text-danger">
            Dire {!radiantWin ? "(WIN)" : ""}
          </span>
        </div>
        <table className="w-full">
          <tbody>
            {direPlayers.map((player) => (
              <PlayerRow
                key={player.player_slot}
                player={player}
                hero={heroes[player.hero_id]}
                isRadiant={false}
                isWin={!radiantWin}
                isTracked={player.account_id === trackedAccountId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
