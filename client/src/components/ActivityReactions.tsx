import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ActivityReactionsProps {
  activityId: string;
}

export default function ActivityReactions({ activityId }: ActivityReactionsProps) {
  const { toast } = useToast();

  // Fetch reactions
  const { data: reactions } = useQuery({
    queryKey: ['/api/activities', activityId, 'reactions'],
    queryFn: async () => {
      const res = await fetch(`/api/activities/${activityId}/reactions`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch reactions');
      return res.json();
    },
  });

  // Add/update reaction
  const addReactionMutation = useMutation({
    mutationFn: async (type: 'thumbs_up' | 'thumbs_down') => {
      const res = await apiRequest(`/api/activities/${activityId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Failed to add reaction');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities', activityId, 'reactions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    },
  });

  // Remove reaction
  const removeReactionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/activities/${activityId}/reactions`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove reaction');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities', activityId, 'reactions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    },
  });

  const handleReaction = (type: 'thumbs_up' | 'thumbs_down') => {
    if (reactions?.userReaction === type) {
      // Remove reaction if clicking the same one
      removeReactionMutation.mutate();
    } else {
      // Add or update reaction
      addReactionMutation.mutate(type);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleReaction('thumbs_up')}
        disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
        className={reactions?.userReaction === 'thumbs_up' ? 'text-green-600' : ''}
        data-testid={`button-thumbs-up-${activityId}`}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        <span data-testid={`count-thumbs-up-${activityId}`}>{reactions?.thumbsUp || 0}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleReaction('thumbs_down')}
        disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
        className={reactions?.userReaction === 'thumbs_down' ? 'text-red-600' : ''}
        data-testid={`button-thumbs-down-${activityId}`}
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        <span data-testid={`count-thumbs-down-${activityId}`}>{reactions?.thumbsDown || 0}</span>
      </Button>
    </div>
  );
}
