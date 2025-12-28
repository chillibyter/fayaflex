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
import { PlusCircle, Search, Users, UserPlus, Share2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Team } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      toast({ title: "Joined team!", description: "You've successfully joined the team." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to join team", variant: "destructive" });
    },
  });

  const endChallengeMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/archive`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEndChallengeDialogOpen(false);
      setSelectedTeam(null);
      toast({ title: "Challenge ended", description: "The team challenge has been ended." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to end challenge", variant: "destructive" });
    },
  });

  const handleInviteClick = (team: EnrichedTeam) => {
    setSelectedTeam(team);
    setShareDialogOpen(true);
  };

  const copyInviteCode = () => {
    if (selectedTeam?.inviteCode) {
      navigator.clipboard.writeText(selectedTeam.inviteCode);
      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    }
  };

  const shareViaWhatsApp = () => {
    if (!selectedTeam?.inviteCode) return;
    const appUrl = window.location.origin;
    const message = `Join my fitness team "${selectedTeam.name}" on Ultimate Fitness Challenge!\n\nInvite Code: ${selectedTeam.inviteCode}\n\nDownload the app: ${appUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaGeneric = async () => {
    if (!selectedTeam?.inviteCode) return;
    const appUrl = window.location.origin;
    const message = `Join my fitness team "${selectedTeam.name}"!\n\nInvite Code: ${selectedTeam.inviteCode}\n\n${appUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${selectedTeam.name}`, text: message, url: appUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(message);
      toast({ title: "Copied!", description: "Share message copied." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-4 pt-4 pb-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-join-team">
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
                <DialogDescription>Enter the invite code shared by your team owner.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label>Invite Code</Label>
                <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter invite code" data-testid="input-invite-code" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => joinTeamMutation.mutate(inviteCode.trim())} disabled={!inviteCode.trim() || joinTeamMutation.isPending} data-testid="button-join-team-submit">
                  {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" asChild data-testid="button-create-team">
            <Link href="/create-team">Create Team</Link>
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-2">My Teams</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background" data-testid="input-search-teams" />
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-6">Create or join a team to get started!</p>
              <Button asChild>
                <Link href="/create-team">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {teams
              .filter((team) => team.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((team) => (
                <div key={team.id} className="min-w-[280px] max-w-[280px] snap-start">
                  <TeamCard
                    teamId={team.id}
                    name={team.name}
                    memberCount={team.memberCount}
                    totalCalories={0}
                    rank={0}
                    isOwner={Boolean(user && typeof user === 'object' && 'id' in user && team.ownerId === (user as any).id)}
                    onInvite={() => handleInviteClick(team)}
                    onEndChallenge={() => { setSelectedTeam(team); setEndChallengeDialogOpen(true); }}
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {selectedTeam?.name}</DialogTitle>
            <DialogDescription>Share this code with others to let them join.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <div className="flex gap-2">
                <Input value={selectedTeam?.inviteCode || ""} readOnly className="font-mono" data-testid="text-invite-code" />
                <Button onClick={copyInviteCode} data-testid="button-copy-code">Copy</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={shareViaWhatsApp} variant="outline" data-testid="button-share-whatsapp">
                <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
                WhatsApp
              </Button>
              <Button onClick={shareViaGeneric} variant="outline" data-testid="button-share-generic">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={endChallengeDialogOpen} onOpenChange={setEndChallengeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Team Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the challenge for "{selectedTeam?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end-challenge">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTeam && endChallengeMutation.mutate(selectedTeam.id)}
              disabled={endChallengeMutation.isPending}
              className="bg-destructive text-destructive-foreground"
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
