import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, Plus, Clock, ChevronRight, Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CreateStakeDialog from "@/components/CreateStakeDialog";
import type { Stake, Team } from "@shared/schema";

type TeamWithMeta = Team & { memberCount?: number };

function StakeListItem({ stake }: { stake: Stake }) {
  const days = Math.max(
    0,
    Math.ceil(
      (new Date(stake.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    completed: "bg-muted text-muted-foreground",
    declined: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <Link href={`/stakes/${stake.id}`}>
      <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-stake-${stake.id}`}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={statusColor[stake.status] || ""}>
                {stake.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {stake.opponentTeamId ? "Inter-team" : "Intra-team"}
              </Badge>
            </div>
            <p className="font-semibold mt-1 truncate" data-testid={`text-stake-title-${stake.id}`}>
              {stake.title}
            </p>
            {stake.stakeAmount && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{stake.stakeAmount}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stake.status === "active" ? `${days}d left` : `${stake.startDate} → ${stake.endDate}`}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}

export default function Stakes() {
  const { data: stakes = [], isLoading } = useQuery<Stake[]>({
    queryKey: ["/api/stakes"],
  });
  const { data: teams = [] } = useQuery<TeamWithMeta[]>({
    queryKey: ["/api/teams"],
  });

  const active = stakes.filter(s => s.status === "active");
  const pending = stakes.filter(s => s.status === "pending");
  const past = stakes.filter(s => ["completed", "declined", "cancelled"].includes(s.status));

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Stakes" backPath="/" />
      <div className="px-4 py-4 max-w-screen-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Friendly competitions inside or between teams.
          </p>
          {teams.length > 0 ? (
            <CreateStakeDialog teams={teams} />
          ) : (
            <Button disabled data-testid="button-create-stake-disabled">
              <Plus className="h-4 w-4 mr-1" /> New stake
            </Button>
          )}
        </div>

        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" data-testid="tab-stakes-active">
              Active {active.length > 0 && <span className="ml-1 text-xs">({active.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-stakes-pending">
              Pending {pending.length > 0 && <span className="ml-1 text-xs">({pending.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-stakes-past">
              Past
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : active.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No active stakes yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start one to give your team a daily reason to push.
                </p>
              </Card>
            ) : (
              active.map(s => <StakeListItem key={s.id} stake={s} />)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nothing pending.</p>
            ) : (
              pending.map(s => <StakeListItem key={s.id} stake={s} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No past stakes yet.</p>
            ) : (
              past.map(s => <StakeListItem key={s.id} stake={s} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
