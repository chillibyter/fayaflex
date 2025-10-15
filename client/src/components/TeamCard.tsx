import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, X, Trophy } from "lucide-react";
import { Link } from "wouter";

interface TeamCardProps {
  teamId: string;
  name: string;
  memberCount: number;
  totalCalories: number;
  rank: number;
  isOwner?: boolean;
  onInvite?: () => void;
  onEndChallenge?: () => void;
}

export default function TeamCard({
  teamId,
  name,
  memberCount,
  totalCalories,
  rank,
  isOwner = false,
  onInvite,
  onEndChallenge,
}: TeamCardProps) {
  return (
    <Link href={`/teams/${teamId}`}>
      <Card 
        className="hover-elevate cursor-pointer transition-all" 
        data-testid={`card-team-${teamId}`}
      >
        <CardHeader className="pb-4">
          <div
            className="h-24 -mx-6 -mt-6 mb-4 rounded-t-md flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--chart-2)) 100%)",
            }}
          >
            <h3 className="text-2xl font-bold text-primary-foreground" data-testid={`text-team-name`}>
              {name}
            </h3>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{memberCount} members</span>
            </div>
            <div className="text-sm font-medium">Rank #{rank}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Calories</p>
            <p className="text-3xl font-bold" data-testid="text-team-calories">
              {totalCalories.toLocaleString()}
            </p>
          </div>
          <Button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/teams/${teamId}/victory-wall`;
            }}
            variant="outline"
            className="w-full"
            data-testid="button-victory-wall"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Victory Wall
          </Button>
          {isOwner && (
            <div className="space-y-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onInvite?.();
                }}
                variant="outline"
                className="w-full"
                data-testid="button-invite-members"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onEndChallenge?.();
                }}
                variant="destructive"
                className="w-full"
                data-testid="button-end-challenge"
              >
                <X className="h-4 w-4 mr-2" />
                End Challenge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
