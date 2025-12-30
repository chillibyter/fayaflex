import { Card, CardContent } from "@/components/ui/card";
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
  challengeName?: string;
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
  challengeName,
  isOwner = false,
  onInvite,
  onEndChallenge,
}: TeamCardProps) {
  return (
    <Card 
      className="overflow-hidden border-0 shadow-lg" 
      data-testid={`card-team-${teamId}`}
    >
      <Link href={`/teams/${teamId}`}>
        <div
          className="p-4 text-white cursor-pointer hover-elevate"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0ea5e9 100%)",
          }}
        >
          <h3 className="text-lg font-bold truncate" data-testid={`text-team-name`}>
            {name}
          </h3>
          {challengeName && (
            <p className="text-sm text-white/80 truncate">{challengeName}</p>
          )}
          
          <div className="flex items-center gap-1 mt-3">
            <div className="flex -space-x-2">
              {[...Array(Math.min(memberCount, 3))].map((_, i) => (
                <Avatar key={i} className="h-7 w-7 border-2 border-white">
                  <AvatarFallback className="text-xs bg-white/20 text-white">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm ml-2">{memberCount} members</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-white/70">Rank number</p>
              <p className="text-xl font-bold">{rank}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Total Calories</p>
              <p className="text-xl font-bold">{totalCalories.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-3 space-y-2 bg-card">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary text-primary hover:bg-primary/10"
          data-testid="button-victory-wall"
          asChild
        >
          <Link href={`/teams/${teamId}/victory-wall`}>
            Victory Wall
          </Link>
        </Button>
        
        {isOwner && (
          <>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInvite?.();
              }}
              size="sm"
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-invite-members"
            >
              Invite Members
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEndChallenge?.();
              }}
              variant="destructive"
              size="sm"
              className="w-full"
              data-testid="button-end-challenge"
            >
              <X className="h-4 w-4 mr-1" />
              End Challenge
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
