import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ActivityReactionsProps {
  activityId: string;
}

interface Reactor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  type: "thumbs_up" | "thumbs_down";
}

function fullName(r: Reactor) {
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
  return name || "Anonymous";
}

function initials(r: Reactor) {
  const f = (r.firstName || "").charAt(0);
  const l = (r.lastName || "").charAt(0);
  return (f + l).toUpperCase() || "?";
}

export default function ActivityReactions({ activityId }: ActivityReactionsProps) {
  const { toast } = useToast();
  const [openSide, setOpenSide] = useState<null | "thumbs_up" | "thumbs_down">(null);

  const { data: reactions } = useQuery<{
    thumbsUp: number;
    thumbsDown: number;
    userReaction?: "thumbs_up" | "thumbs_down";
  }>({
    queryKey: ["/api/activities", activityId, "reactions"],
    queryFn: async () => {
      const res = await fetch(`/api/activities/${activityId}/reactions`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reactions");
      return res.json();
    },
  });

  const { data: reactors, isLoading: reactorsLoading } = useQuery<Reactor[]>({
    queryKey: ["/api/activities", activityId, "reactors"],
    queryFn: async () => {
      const res = await fetch(`/api/activities/${activityId}/reactors`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reactors");
      return res.json();
    },
    enabled: openSide !== null,
  });

  const addReactionMutation = useMutation({
    mutationFn: async (type: "thumbs_up" | "thumbs_down") => {
      const res = await fetch(`/api/activities/${activityId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add reaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities", activityId, "reactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", activityId, "reactors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add reaction",
        variant: "destructive",
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/activities/${activityId}/reactions`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove reaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities", activityId, "reactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", activityId, "reactors"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    },
  });

  const handleReaction = (type: "thumbs_up" | "thumbs_down") => {
    if (reactions?.userReaction === type) {
      removeReactionMutation.mutate();
    } else {
      addReactionMutation.mutate(type);
    }
  };

  const renderReactorList = (side: "thumbs_up" | "thumbs_down") => {
    const filtered = (reactors || []).filter((r) => r.type === side);
    if (reactorsLoading) {
      return <div className="text-sm text-muted-foreground p-2">Loading…</div>;
    }
    if (filtered.length === 0) {
      return <div className="text-sm text-muted-foreground p-2">No one yet</div>;
    }
    return (
      <div className="max-h-64 overflow-y-auto">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover-elevate"
            data-testid={`reactor-${side}-${r.id}`}
          >
            <Avatar className="h-8 w-8">
              {r.profileImageUrl && <AvatarImage src={r.profileImageUrl} alt={fullName(r)} />}
              <AvatarFallback>{initials(r)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{fullName(r)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction("thumbs_up")}
          disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
          className={reactions?.userReaction === "thumbs_up" ? "text-green-600" : ""}
          data-testid={`button-thumbs-up-${activityId}`}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Popover
          open={openSide === "thumbs_up"}
          onOpenChange={(o) => setOpenSide(o ? "thumbs_up" : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!reactions?.thumbsUp}
              data-testid={`count-thumbs-up-${activityId}`}
              className="px-2 -ml-1"
            >
              {reactions?.thumbsUp || 0}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-1">
              Thumbs up
            </div>
            {renderReactorList("thumbs_up")}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction("thumbs_down")}
          disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
          className={reactions?.userReaction === "thumbs_down" ? "text-red-600" : ""}
          data-testid={`button-thumbs-down-${activityId}`}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
        <Popover
          open={openSide === "thumbs_down"}
          onOpenChange={(o) => setOpenSide(o ? "thumbs_down" : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!reactions?.thumbsDown}
              data-testid={`count-thumbs-down-${activityId}`}
              className="px-2 -ml-1"
            >
              {reactions?.thumbsDown || 0}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-1">
              Thumbs down
            </div>
            {renderReactorList("thumbs_down")}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
