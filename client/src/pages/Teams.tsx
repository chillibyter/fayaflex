import TeamCard from "@/components/TeamCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Search, Users, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Team } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended type with member count from API
type EnrichedTeam = Team & { memberCount: number };

export default function Teams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [endChallengeDialogOpen, setEndChallengeDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<EnrichedTeam | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: teams = [], isLoading } = useQuery<EnrichedTeam[]>({
    queryKey: ["/api/teams"],
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/teams/join", { inviteCode: code });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setJoinDialogOpen(false);
      setInviteCode("");
      toast({
        title: "Joined team!",
        description: "You've successfully joined the team.",
      });
    },
    onError: (error: any) => {
      // Extract error message from API response
      let errorMessage = "Failed to join team";
      
      if (error?.message) {
        // Try to parse JSON error from API response
        // Format is typically: "400: {\"message\":\"...\"}"
        try {
          const jsonMatch = error.message.match(/\d+:\s*({.+})/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[1]);
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleJoinTeam = () => {
    if (inviteCode.trim()) {
      joinTeamMutation.mutate(inviteCode.trim());
    }
  };

  const handleInviteClick = (team: EnrichedTeam) => {
    setSelectedTeam(team);
    setShareDialogOpen(true);
  };

  const copyInviteCode = () => {
    if (selectedTeam?.inviteCode) {
      navigator.clipboard.writeText(selectedTeam.inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard.",
      });
    }
  };

  const endChallengeMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/archive`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEndChallengeDialogOpen(false);
      setSelectedTeam(null);
      toast({
        title: "Challenge ended",
        description: "The team challenge has been successfully ended.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end challenge",
        variant: "destructive",
      });
    },
  });

  const handleEndChallengeClick = (team: EnrichedTeam) => {
    setSelectedTeam(team);
    setEndChallengeDialogOpen(true);
  };

  const confirmEndChallenge = () => {
    if (selectedTeam) {
      endChallengeMutation.mutate(selectedTeam.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and track group progress.
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-join-team">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
                <DialogDescription>
                  Enter the invite code shared by your team owner to join.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    data-testid="input-invite-code"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setJoinDialogOpen(false)}
                  disabled={joinTeamMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoinTeam}
                  disabled={!inviteCode.trim() || joinTeamMutation.isPending}
                  data-testid="button-join-team-submit"
                >
                  {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button asChild data-testid="button-create-team">
            <Link href="/create-team">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Team
            </Link>
          </Button>
        </div>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading teams...</p>
          </div>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first team or join an existing one to get started!
            </p>
            <Button asChild>
              <Link href="/create-team">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams
            .filter((team) =>
              team.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((team) => (
              <TeamCard
                key={team.id}
                teamId={team.id}
                name={team.name}
                memberCount={team.memberCount}
                totalCalories={0}
                rank={0}
                isOwner={Boolean(user && typeof user === 'object' && 'id' in user && team.ownerId === (user as any).id)}
                onInvite={() => handleInviteClick(team)}
                onEndChallenge={() => handleEndChallengeClick(team)}
              />
            ))}
        </div>
      )}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Members to {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Share this invite code with others to let them join your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <div className="flex gap-2">
                <Input
                  value={selectedTeam?.inviteCode || ""}
                  readOnly
                  className="font-mono"
                  data-testid="text-invite-code"
                />
                <Button onClick={copyInviteCode} data-testid="button-copy-code">
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Anyone with this code can join your team.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={endChallengeDialogOpen} onOpenChange={setEndChallengeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Team Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the challenge for "{selectedTeam?.name}"? This action cannot be undone and the team will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end-challenge">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEndChallenge}
              disabled={endChallengeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-end-challenge"
            >
              {endChallengeMutation.isPending ? "Ending..." : "End Challenge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
