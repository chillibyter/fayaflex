import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TeamOption = { id: string; name: string };

interface Props {
  /** Teams the user can host a stake on behalf of. */
  teams: TeamOption[];
  /**
   * When provided, the host team is pre-selected AND the picker is hidden —
   * used when the dialog is opened from inside a specific team page so the
   * stake is unambiguously scoped to that team.
   */
  lockedHostTeamId?: string;
  /** Optional custom trigger; defaults to a "New stake" button. */
  trigger?: ReactNode;
}

/**
 * Shared dialog for creating a stake. Used both on the dedicated Stakes page
 * (with team picker) and inside a team page (host team locked to that team).
 */
export default function CreateStakeDialog({ teams, lockedHostTeamId, trigger }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [interTeam, setInterTeam] = useState(false);
  const [title, setTitle] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [description, setDescription] = useState("");
  const [hostTeamId, setHostTeamId] = useState<string>(lockedHostTeamId ?? "");
  const [opponentTeamId, setOpponentTeamId] = useState<string>("");
  const [durationDays, setDurationDays] = useState(7);

  // /api/leaderboard/teams exposes `{ teamId, name, ... }` — normalize to
  // `{ id, name }` for the Select.
  const { data: allTeams } = useQuery<TeamOption[]>({
    queryKey: ["/api/teams/all-from-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/teams", { credentials: "include" });
      if (!res.ok) return [];
      const rows: Array<{ teamId: string; name: string }> = await res.json();
      return rows.map((r) => ({ id: r.teamId, name: r.name }));
    },
    enabled: interTeam,
  });

  const effectiveHostTeamId = lockedHostTeamId ?? hostTeamId;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stakes", {
        teamId: effectiveHostTeamId,
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
      if (!lockedHostTeamId) setHostTeamId("");
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to create stake", variant: "destructive" });
    },
  });

  const canSubmit =
    title.trim().length >= 3 &&
    !!effectiveHostTeamId &&
    (!interTeam || !!opponentTeamId) &&
    durationDays >= 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button data-testid="button-create-stake">
            <Plus className="h-4 w-4 mr-1" /> New stake
          </Button>
        )}
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

          {!lockedHostTeamId && (
            <div className="space-y-2">
              <Label>Your team</Label>
              <Select value={hostTeamId} onValueChange={setHostTeamId}>
                <SelectTrigger data-testid="select-stake-host-team">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                    .filter((t) => t.id !== effectiveHostTeamId)
                    .map((t) => (
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
