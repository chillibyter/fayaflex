import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreateTeam() {
  const [, setLocation] = useLocation();
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team created!",
        description: "Your team has been created successfully.",
      });
      setLocation("/teams");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeamMutation.mutate({
      name: teamName,
      description: description || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Team</h1>
        <p className="text-muted-foreground">
          Start a new fitness challenge team and invite others to join.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
                data-testid="input-team-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what your team is about..."
                rows={4}
                data-testid="input-team-description"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={createTeamMutation.isPending}
                data-testid="button-create-team-submit"
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/teams")}
                disabled={createTeamMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
