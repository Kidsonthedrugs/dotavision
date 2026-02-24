"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, getMMRColor, getMMRTier } from "@/lib/utils";
import { Search, Menu, Bell, LogOut, User, Settings } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, isAuthenticated, logout } = useAppStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/player/${searchQuery.trim()}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--color-card-border)] bg-[var(--color-card)] px-4 md:left-[280px]">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className={cn(
          "relative flex-1 max-w-md transition-all duration-200",
          searchFocused && "max-w-lg"
        )}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-foreground-muted)]" />
        <Input
          id="topbar-search"
          type="search"
          placeholder="Search player by ID or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-10"
        />
      </form>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
        </Button>

        {/* User Section */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* Player Info */}
            <div className="hidden sm:flex items-center gap-2">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.personaName}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.personaName}</span>
                {user.settings?.favoriteHeroes && (
                  <Badge
                    variant="default"
                    className="h-5 text-xs"
                    style={{
                      backgroundColor: getMMRColor(
                        user.mmrHistory?.[0]?.mmr || 0
                      ),
                    }}
                  >
                    {getMMRTier(user.mmrHistory?.[0]?.mmr || 0)}
                  </Badge>
                )}
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              // For MVP: Sign In focuses the search input instead of full auth
              const searchInput = document.getElementById("topbar-search") as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              } else {
                // If no search on this page, go to home page with search
                router.push("/");
              }
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
