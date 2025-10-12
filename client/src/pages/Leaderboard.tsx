import LeaderboardCard from "@/components/LeaderboardCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Leaderboard() {
  const personalLeaderboard = [
    { rank: 1, name: "Sarah Johnson", teamName: "Team Alpha", calories: 32500, goalPercentage: 108 },
    { rank: 2, name: "Mike Chen", teamName: "Team Beta", calories: 31200, goalPercentage: 104 },
    { rank: 3, name: "Emma Davis", teamName: "Team Gamma", calories: 29800, goalPercentage: 99 },
    { rank: 4, name: "John Doe", teamName: "Team Alpha", calories: 28500, goalPercentage: 95 },
    { rank: 5, name: "Lisa Wang", teamName: "Team Delta", calories: 27800, goalPercentage: 93 },
  ];

  const teamLeaderboard = [
    { rank: 1, name: "Team Alpha", teamName: "12 members", calories: 385000, goalPercentage: 102 },
    { rank: 2, name: "Team Beta", teamName: "15 members", calories: 362000, goalPercentage: 98 },
    { rank: 3, name: "Team Gamma", teamName: "10 members", calories: 341000, goalPercentage: 95 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you and your team rank this month.
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          December 2025
        </Badge>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {personalLeaderboard.map((entry) => (
            <LeaderboardCard key={entry.rank} {...entry} />
          ))}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {teamLeaderboard.map((entry) => (
            <LeaderboardCard key={entry.rank} {...entry} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
