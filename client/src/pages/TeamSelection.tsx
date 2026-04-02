import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Trophy, User, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type TeamPreview = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isFull: boolean;
};

export default function TeamSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Join team state
  const [inviteCode, setInviteCode] = useState("");

  // Create team state
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  const handleSkipTeam = () => {
    if (user) {
      localStorage.setItem(`fayaflex_skip_team_${user.id}`, "true");
      toast({
        title: "Exploring solo",
        description: "Visit the Teams page anytime to join or create a team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setLocation("/");
    }
  };

  // Preview the team from the invite code (debounced by query enabled check)
  const trimmedCode = inviteCode.trim();
  const { data: teamPreview, isLoading: previewLoading, isError: previewError } =
    useQuery<TeamPreview>({
      queryKey: ["/api/teams/invite", trimmedCode],
      queryFn: async () => {
        const res = await fetch(`/api/teams/invite/${trimmedCode}`);
        if (!res.ok) throw new Error("Invalid code");
        return res.json();
      },
      enabled: trimmedCode.length >= 6,
      retry: false,
    });

  const joinTeamMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/teams/join", { inviteCode: code });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to join team");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Joined team!", description: "You've successfully joined the team." });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Could not join",
        description: error.message || "Failed to join team.",
        variant: "destructive",
      });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Team created!", description: "You've successfully created your team." });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create team",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeamMutation.mutateAsync({
      name: teamName,
      description: teamDescription || undefined,
    });
  };

  const handleJoin = () => {
    joinTeamMutation.mutate(trimmedCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to FayaFlex!</CardTitle>
          <CardDescription className="text-base">
            Teams compete together and support each other in reaching fitness goals. Join or create a team, or explore solo first.
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-4 -mt-2">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Want to explore first?</p>
                    <p className="text-sm text-muted-foreground">You can join a team anytime later</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSkipTeam}
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 whitespace-nowrap"
                  data-testid="button-skip-team"
                >
                  Try Solo First
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join" data-testid="tab-join-team">
                <Users className="w-4 h-4 mr-2" />
                Join a Team
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-team">
                <Plus className="w-4 h-4 mr-2" />
                Create a Team
              </TabsTrigger>
            </TabsList>

            {/* ── JOIN TAB ── */}
            <TabsContent value="join" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite code</Label>
                <Input
                  id="invite-code"
                  data-testid="input-invite-code"
                  type="text"
                  placeholder="Paste your invite code here"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  You'll find this in the invite message — it looks like{" "}
                  <span className="font-mono bg-muted px-1 rounded">34f147b0379d</span>
                </p>
              </div>

              {/* Live team preview */}
              {trimmedCode.length >= 6 && (
                <div className="rounded-md border bg-muted/30 p-4">
                  {previewLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Looking up team…
                    </div>
                  ) : previewError || !teamPreview ? (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Code not found — check for typos and try again.
                    </div>
                  ) : teamPreview.isFull ? (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span><strong>{teamPreview.name}</strong> is full (20/20 members).</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold">{teamPreview.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {teamPreview.memberCount} member{teamPreview.memberCount !== 1 ? "s" : ""}
                          {teamPreview.description ? ` · ${teamPreview.description}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={
                  !trimmedCode ||
                  !teamPreview ||
                  teamPreview.isFull ||
                  joinTeamMutation.isPending
                }
                data-testid="button-join-team-submit"
              >
                {joinTeamMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining…</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Join Team</>
                )}
              </Button>
            </TabsContent>

            {/* ── CREATE TAB ── */}
            <TabsContent value="create" className="space-y-4 mt-6">
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    data-testid="input-team-name"
                    type="text"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    minLength={3}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (Optional)</Label>
                  <Input
                    id="team-description"
                    data-testid="input-team-description"
                    type="text"
                    placeholder="Tell others about your team…"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="button-create-team"
                  className="w-full"
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Creating…" : "Create Team"}
                </Button>
              </form>

              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> As the team creator, you'll be the team owner and can invite members, manage the team, and view the victory wall.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
