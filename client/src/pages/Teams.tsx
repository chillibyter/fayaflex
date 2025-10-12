import TeamCard from "@/components/TeamCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Teams() {
  const [searchQuery, setSearchQuery] = useState("");

  const teams = [
    { name: "Team Alpha", memberCount: 12, totalCalories: 385000, rank: 1, isOwner: true },
    { name: "Team Beta", memberCount: 15, totalCalories: 362000, rank: 2, isOwner: false },
    { name: "Team Gamma", memberCount: 10, totalCalories: 341000, rank: 3, isOwner: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and track group progress.
          </p>
        </div>
        <Button asChild data-testid="button-create-team">
          <Link href="/create-team">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Team
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-teams"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <TeamCard
            key={team.name}
            {...team}
            onInvite={() => console.log(`Invite to ${team.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
