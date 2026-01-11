import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Lock, Users, MoreVertical, LogOut, Trash2, UserMinus } from "lucide-react";
import LeaderboardCard from "@/components/LeaderboardCard";
import { Card, CardContent } from "@/components/ui/card";
import { TeamChat } from "@/components/TeamChat";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from "react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  calories: number;
  goalPercentage: number;
  userId?: string;
};

export default function TeamLeaderboard() {
  const params = useParams();
  const teamId = params.teamId;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showKickDialog, setShowKickDialog] = useState<{ userId: string; name: string } | null>(null);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy");

  const { 
    data: leaderboard = [], 
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/team', teamId, { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/leaderboard/team/${teamId}?month=${currentMonth}&year=${currentYear}`);
      return res.json();
    },
  });

  const { data: teamData } = useQuery({
    queryKey: ['/api/teams'],
    select: (teams: any[]) => teams.find(t => t.id === teamId),
  });

  const isOwner = teamData?.ownerId === user?.id;

  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/leave`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to leave team");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "You have left the team" });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      navigate("/teams");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete team");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Team has been deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      navigate("/teams");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}/members/${targetUserId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove member");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Member has been removed from the team" });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard/team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] });
      setShowKickDialog(null);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back-to-teams">
              <Link href="/teams">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-team-name">
                {teamData?.name || 'Team'} Leaderboard
              </h1>
              <p className="text-muted-foreground">
                Individual rankings for this team. Scores reset on the 1st of each month.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-4 py-2" data-testid="badge-month">
            {monthName}
          </Badge>
          {teamData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-team-menu">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                      data-testid="menu-delete-team"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Team
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setShowLeaveDialog(true)}
                    className="text-destructive"
                    data-testid="menu-leave-team"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Team
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isError ? (
          <>
            {(error as any)?.status === 403 ? (
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Lock className="h-16 w-16 mx-auto text-yellow-600" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Team Members Only</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        This leaderboard is only available to team members. Join this team to view their rankings and compete together!
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Button variant="outline" asChild data-testid="button-back-to-teams">
                        <Link href="/teams">
                          <Users className="h-4 w-4 mr-2" />
                          View My Teams
                        </Link>
                      </Button>
                      <Button asChild data-testid="button-go-to-leaderboard">
                        <Link href="/leaderboard">
                          View Leaderboard
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">Failed to load team leaderboard</p>
                <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                  Try Again
                </Button>
              </div>
            )}
          </>
        ) : isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : leaderboard.length > 0 ? (
          leaderboard.map((entry) => (
            <div key={entry.rank} className="flex items-center gap-2">
              <div className="flex-1">
                <LeaderboardCard {...entry} />
              </div>
              {isOwner && entry.userId && entry.userId !== user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKickDialog({ userId: entry.userId!, name: entry.name })}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  data-testid={`button-kick-${entry.userId}`}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No rankings yet. Team members need to log activities to appear on the leaderboard!
          </div>
        )}
      </div>

      {!isError && teamId && (
        <TeamChat teamId={teamId} teamName={teamData?.name || 'Team'} />
      )}

      {/* Leave Team Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave {teamData?.name}? You can rejoin later with an invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-leave">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveTeamMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={leaveTeamMutation.isPending}
              data-testid="button-confirm-leave"
            >
              {leaveTeamMutation.isPending ? "Leaving..." : "Leave Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {teamData?.name}? This action cannot be undone. All team data, members, and messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeamMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTeamMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick Member Dialog */}
      <AlertDialog open={!!showKickDialog} onOpenChange={(open) => !open && setShowKickDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {showKickDialog?.name} from the team? They can rejoin later with an invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-kick">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showKickDialog && kickMemberMutation.mutate(showKickDialog.userId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={kickMemberMutation.isPending}
              data-testid="button-confirm-kick"
            >
              {kickMemberMutation.isPending ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
