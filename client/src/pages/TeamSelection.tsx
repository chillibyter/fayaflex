import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search, Trophy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Team = {
  id: number;
  name: string;
  description?: string | null;
  memberCount: number;
  isOwner: boolean;
  isMember: boolean;
};

export default function TeamSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Create team state
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  
  // Join team state
  const [searchQuery, setSearchQuery] = useState("");

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest('POST', '/api/teams', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team created!",
        description: "You've successfully created your team.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/teams'] });
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

  const joinTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await apiRequest('POST', `/api/teams/${teamId}/join`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined team!",
        description: "You've successfully joined the team.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/teams'] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join team",
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

  const filteredTeams = teams.filter(team =>
    !team.isMember && team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to UFC!</CardTitle>
          <CardDescription className="text-base">
            To start your fitness journey, you need to join or create a team. Teams compete together and support each other in reaching fitness goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join" data-testid="tab-join-team">
                <Search className="w-4 h-4 mr-2" />
                Join a Team
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-team">
                <Plus className="w-4 h-4 mr-2" />
                Create a Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="search-teams">Search for a team</Label>
                <Input
                  id="search-teams"
                  data-testid="input-search-teams"
                  type="text"
                  placeholder="Enter team name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : filteredTeams.length > 0 ? (
                  filteredTeams.map((team) => (
                    <Card key={team.id} className="hover-elevate" data-testid={`team-card-${team.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            {team.description && (
                              <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => joinTeamMutation.mutate(team.id)}
                            disabled={joinTeamMutation.isPending}
                            data-testid={`button-join-team-${team.id}`}
                          >
                            {joinTeamMutation.isPending ? "Joining..." : "Join"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No teams found matching your search." : "No teams available. Create one to get started!"}
                  </div>
                )}
              </div>
            </TabsContent>

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
                    placeholder="Tell others about your team..."
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
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
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
