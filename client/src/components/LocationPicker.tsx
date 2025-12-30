import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

type Location = {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  isoCode: string | null;
  sortOrder: number | null;
};

interface LocationPickerProps {
  continentId: string | null;
  countryId: string | null;
  regionId: string | null;
  townId: string | null;
  onContinentChange: (id: string | null) => void;
  onCountryChange: (id: string | null) => void;
  onRegionChange: (id: string | null) => void;
  onTownChange: (id: string | null) => void;
}

export function LocationPicker({
  continentId,
  countryId,
  regionId,
  townId,
  onContinentChange,
  onCountryChange,
  onRegionChange,
  onTownChange,
}: LocationPickerProps) {
  const { data: continents = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  const { data: countries = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations', { parentId: continentId }],
    queryFn: async () => {
      if (!continentId) return [];
      const res = await fetch(`/api/locations?parentId=${continentId}`);
      return res.json();
    },
    enabled: !!continentId,
  });

  const { data: regions = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations', { parentId: countryId }],
    queryFn: async () => {
      if (!countryId) return [];
      const res = await fetch(`/api/locations?parentId=${countryId}`);
      return res.json();
    },
    enabled: !!countryId,
  });

  const { data: towns = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations', { parentId: regionId }],
    queryFn: async () => {
      if (!regionId) return [];
      const res = await fetch(`/api/locations?parentId=${regionId}`);
      return res.json();
    },
    enabled: !!regionId,
  });

  const handleContinentChange = (value: string) => {
    const newValue = value === "none" ? null : value;
    onContinentChange(newValue);
    onCountryChange(null);
    onRegionChange(null);
    onTownChange(null);
  };

  const handleCountryChange = (value: string) => {
    const newValue = value === "none" ? null : value;
    onCountryChange(newValue);
    onRegionChange(null);
    onTownChange(null);
  };

  const handleRegionChange = (value: string) => {
    const newValue = value === "none" ? null : value;
    onRegionChange(newValue);
    onTownChange(null);
  };

  const handleTownChange = (value: string) => {
    const newValue = value === "none" ? null : value;
    onTownChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Location (for rankings)</Label>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Select value={continentId || "none"} onValueChange={handleContinentChange}>
          <SelectTrigger data-testid="select-continent" className="h-9">
            <SelectValue placeholder="Continent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not set</SelectItem>
            {continents.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={countryId || "none"} 
          onValueChange={handleCountryChange}
          disabled={!continentId}
        >
          <SelectTrigger data-testid="select-country" className="h-9">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not set</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={regionId || "none"} 
          onValueChange={handleRegionChange}
          disabled={!countryId}
        >
          <SelectTrigger data-testid="select-region" className="h-9">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not set</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={townId || "none"} 
          onValueChange={handleTownChange}
          disabled={!regionId}
        >
          <SelectTrigger data-testid="select-town" className="h-9">
            <SelectValue placeholder="Town/City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not set</SelectItem>
            {towns.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Your location enables you to compete in regional leaderboards
      </p>
    </div>
  );
}
