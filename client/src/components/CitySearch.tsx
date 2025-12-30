import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Location = {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  isoCode: string | null;
  sortOrder: number | null;
};

type CityResult = {
  city: Location;
  hierarchy: Location[];
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
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = useQuery<CityResult[]>({
    queryKey: ['/api/locations/search/cities', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const res = await fetch(`/api/locations/search/cities?q=${encodeURIComponent(query)}&limit=8`);
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

  const handleSelect = (result: CityResult) => {
    setSelectedCity(result);
    setQuery("");
    setIsOpen(false);

    const hierarchy = result.hierarchy;
    const continent = hierarchy.find(l => l.type === 'continent');
    const country = hierarchy.find(l => l.type === 'country');
    const region = hierarchy.find(l => l.type === 'region');
    const town = hierarchy.find(l => l.type === 'town');

    onSelect({
      continentId: continent?.id || null,
      countryId: country?.id || null,
      regionId: region?.id || null,
      townId: town?.id || null,
    });
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

  const formatLocationPath = (hierarchy: Location[]) => {
    return hierarchy
      .filter(l => l.type !== 'town')
      .map(l => l.name)
      .join(', ');
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
              <Check className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-medium truncate block">{selectedCity.city.name}</span>
                <span className="text-xs text-muted-foreground truncate block">
                  {formatLocationPath(selectedCity.hierarchy)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleClear}
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
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    No cities found matching "{query}"
                  </div>
                ) : (
                  results.map((result) => (
                    <button
                      key={result.city.id}
                      type="button"
                      className="w-full text-left p-3 hover-elevate transition-colors border-b last:border-0"
                      onClick={() => handleSelect(result)}
                      data-testid={`city-result-${result.city.id}`}
                    >
                      <div className="font-medium">{result.city.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatLocationPath(result.hierarchy)}
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
