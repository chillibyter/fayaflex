import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Search, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type GeoNamesResult = {
  geonameId: number;
  cityName: string;
  regionName: string;
  countryName: string;
  countryCode: string;
  continentCode: string;
  continentName: string;
  displayName: string;
  population: number;
};

interface CitySearchProps {
  onSelect: (result: { 
    continentId: string | null;
    countryId: string | null;
    regionId: string | null;
    townId: string | null;
  }) => void;
  initialLocation?: {
    continentId?: string | null;
    countryId?: string | null;
    regionId?: string | null;
    townId?: string | null;
  };
  className?: string;
}

export function CitySearch({ onSelect, initialLocation, className }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<GeoNamesResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = useQuery<GeoNamesResult[]>({
    queryKey: ['/api/locations/search/cities', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const res = await fetch(`/api/locations/search/cities?q=${encodeURIComponent(query)}&limit=10`);
      return res.json();
    },
    enabled: query.length >= 2,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (result: GeoNamesResult) => {
    setSelectedCity(result);
    setQuery("");
    setIsOpen(false);
    setIsCreating(true);

    try {
      const response = await apiRequest("POST", "/api/locations/from-geonames", {
        geonameId: result.geonameId,
        cityName: result.cityName,
        regionName: result.regionName,
        countryName: result.countryName,
        countryCode: result.countryCode,
        continentCode: result.continentCode,
        continentName: result.continentName,
      });
      
      const hierarchy = await response.json();
      
      onSelect({
        continentId: hierarchy.continentId || null,
        countryId: hierarchy.countryId || null,
        regionId: hierarchy.regionId || null,
        townId: hierarchy.townId || null,
      });
    } catch (error) {
      console.error("Failed to create location hierarchy:", error);
      setSelectedCity(null);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClear = () => {
    setSelectedCity(null);
    setQuery("");
    onSelect({
      continentId: null,
      countryId: null,
      regionId: null,
      townId: null,
    });
    inputRef.current?.focus();
  };

  const formatLocationPath = (result: GeoNamesResult) => {
    const parts = [];
    if (result.regionName) parts.push(result.regionName);
    parts.push(result.countryName);
    parts.push(result.continentName);
    return parts.join(', ');
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">City</Label>
      </div>
      
      <div className="relative">
        {selectedCity ? (
          <div 
            className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
            data-testid="selected-city-display"
          >
            <div className="flex items-center gap-2 min-w-0">
              {isCreating ? (
                <Loader2 className="h-4 w-4 text-primary shrink-0 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-medium truncate block">{selectedCity.cityName}</span>
                <span className="text-xs text-muted-foreground truncate block">
                  {formatLocationPath(selectedCity)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleClear}
              disabled={isCreating}
              data-testid="button-clear-city"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search for your city..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className="pl-9"
                data-testid="input-city-search"
              />
            </div>

            {isOpen && query.length >= 2 && (
              <div 
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto"
              >
                {isLoading ? (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Searching worldwide...
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    No cities found matching "{query}"
                  </div>
                ) : (
                  results.map((result) => (
                    <button
                      key={result.geonameId}
                      type="button"
                      className="w-full text-left p-3 hover-elevate transition-colors border-b last:border-0"
                      onClick={() => handleSelect(result)}
                      data-testid={`city-result-${result.geonameId}`}
                    >
                      <div className="font-medium">{result.cityName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatLocationPath(result)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
