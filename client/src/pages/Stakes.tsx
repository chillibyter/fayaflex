import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Target, Plus, Clock, ChevronRight, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
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

function CreateStakeDialog({ teams }: { teams: TeamWithMeta[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [interTeam, setInterTeam] = useState(false);
  const [title, setTitle] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [description, setDescription] = useState("");
  const [hostTeamId, setHostTeamId] = useState<string>("");
  const [opponentTeamId, setOpponentTeamId] = useState<string>("");
  const [durationDays, setDurationDays] = useState(7);

  // /api/leaderboard/teams exposes `{ teamId, name, ... }` — normalize to the
  // shape our Select needs (`id`, `name`).
  const { data: allTeams } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/teams/all-from-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/teams", { credentials: "include" });
      if (!res.ok) return [];
      const rows: Array<{ teamId: string; name: string }> = await res.json();
      return rows.map(r => ({ id: r.teamId, name: r.name }));
    },
    enabled: interTeam,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stakes", {
        teamId: hostTeamId,
        opponentTeamId: interTeam ? opponentTeamId : null,
        title,
        description: description || undefined,
        stakeAmount: stakeAmount || undefined,
        durationDays,
        metric: "calories",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stakes/active"] });
      toast({
        title: interTeam ? "Challenge sent" : "Stake created",
        description: interTeam
          ? "Waiting on the other team to accept."
          : "Your teammates can opt in now.",
      });
      setOpen(false);
      setTitle("");
      setStakeAmount("");
      setDescription("");
      setOpponentTeamId("");
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to create stake", variant: "destructive" });
    },
  });

  const canSubmit =
    title.trim().length >= 3 &&
    hostTeamId &&
    (!interTeam || opponentTeamId) &&
    durationDays >= 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-stake">
          <Plus className="h-4 w-4 mr-1" /> New stake
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start a stake</DialogTitle>
          <DialogDescription>
            Pick what's on the line. Stakes run on active calories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Friday weigh-in"
              maxLength={120}
              data-testid="input-stake-title"
            />
          </div>

          <div className="space-y-2">
            <Label>What's on the line</Label>
            <Input
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Loser buys post-workout smoothies"
              data-testid="input-stake-amount"
            />
          </div>

          <div className="space-y-2">
            <Label>Your team</Label>
            <Select value={hostTeamId} onValueChange={setHostTeamId}>
              <SelectTrigger data-testid="select-stake-host-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Challenge another team</p>
              <p className="text-xs text-muted-foreground">Off = intra-team competition.</p>
            </div>
            <Switch
              checked={interTeam}
              onCheckedChange={setInterTeam}
              data-testid="switch-inter-team"
            />
          </div>

          {interTeam && (
            <div className="space-y-2">
              <Label>Opponent team</Label>
              <Select value={opponentTeamId} onValueChange={setOpponentTeamId}>
                <SelectTrigger data-testid="select-stake-opponent-team">
                  <SelectValue placeholder="Select opponent" />
                </SelectTrigger>
                <SelectContent>
                  {(allTeams || [])
                    .filter(t => t.id !== hostTeamId)
                    .map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Duration (days)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={durationDays}
              onChange={(e) => setDurationDays(Math.max(1, Math.min(60, Number(e.target.value))))}
              data-testid="input-stake-duration"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ground rules, edge cases…"
              rows={3}
              data-testid="textarea-stake-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            data-testid="button-submit-stake"
          >
            {createMutation.isPending ? "Creating..." : "Create stake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
