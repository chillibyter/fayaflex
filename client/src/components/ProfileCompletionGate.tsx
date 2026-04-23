import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

type Props = { user: User };

export default function ProfileCompletionGate({ user }: Props) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [location, setLocationState] = useState<{
    continentId: string; countryId: string; regionId: string; townId: string;
  } | null>(
    user.townId
      ? {
          continentId: (user as any).continentId ?? "",
          countryId: (user as any).countryId ?? "",
          regionId: (user as any).regionId ?? "",
          townId: user.townId,
        }
      : null,
  );

  const needsName = !user.firstName;
  const needsCity = !user.townId;
  const open = needsName || needsCity;

  const trimmedFirst = firstName.trim();
  const canSave =
    (!needsName || trimmedFirst.length >= 1) &&
    (!needsCity || (!!location && !!location.townId));

  const mutation = useMutation({
    mutationFn: async () => {
      const data: Record<string, string> = {};
      if (trimmedFirst) data.firstName = trimmedFirst;
      const trimmedLast = lastName.trim();
      if (trimmedLast) data.lastName = trimmedLast;
      if (location) {
        if (location.continentId) data.continentId = location.continentId;
        if (location.countryId) data.countryId = location.countryId;
        if (location.regionId) data.regionId = location.regionId;
        if (location.townId) data.townId = location.townId;
      }
      const res = await apiRequest("PATCH", "/api/auth/user", data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/user"], updated);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile complete", description: "Welcome to FayaFlex." });
    },
    onError: () => {
      toast({
        title: "Could not save",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!open) return null;

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md [&>button.absolute]:hidden"
        data-testid="dialog-profile-completion-gate"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle2 className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Finish setting up your profile</DialogTitle>
          <DialogDescription className="text-center">
            We need your first name and city to put you on location-based leaderboards and match
            you with nearby teams. This only takes a moment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {needsName && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gate-firstname">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gate-firstname"
                  data-testid="input-gate-firstname"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-[10px]"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gate-lastname">Last name</Label>
                <Input
                  id="gate-lastname"
                  data-testid="input-gate-lastname"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
            </div>
          )}
          {needsCity && (
            <div className="space-y-1.5">
              <Label>
                Your city <span className="text-destructive">*</span>
              </Label>
              <CitySearch
                onSelect={(loc) => {
                  if (!loc.townId) {
                    setLocationState(null);
                    return;
                  }
                  setLocationState({
                    continentId: loc.continentId ?? "",
                    countryId: loc.countryId ?? "",
                    regionId: loc.regionId ?? "",
                    townId: loc.townId,
                  });
                }}
              />
              {location && (
                <p className="text-xs text-muted-foreground" data-testid="text-gate-city-selected">
                  City selected
                </p>
              )}
            </div>
          )}
          <div className="pt-1">
            <Button
              className="w-full rounded-[10px]"
              onClick={() => mutation.mutate()}
              disabled={!canSave || mutation.isPending}
              data-testid="button-save-profile-gate"
            >
              {mutation.isPending ? "Saving…" : "Continue"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              You can edit these later in Profile settings.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
