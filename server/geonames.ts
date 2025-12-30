const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || 'demo';
const GEONAMES_BASE_URL = 'http://api.geonames.org';

interface GeoNamesCity {
  geonameId: number;
  name: string;
  toponymName: string;
  countryName: string;
  countryCode: string;
  adminName1: string;
  population: number;
  lat: string;
  lng: string;
  continentCode?: string;
}

interface GeoNamesResponse {
  totalResultsCount: number;
  geonames: GeoNamesCity[];
}

const CONTINENT_MAP: Record<string, { code: string; name: string }> = {
  'AF': { code: 'AF', name: 'Africa' },
  'AN': { code: 'AN', name: 'Antarctica' },
  'AS': { code: 'AS', name: 'Asia' },
  'EU': { code: 'EU', name: 'Europe' },
  'NA': { code: 'NA', name: 'North America' },
  'OC': { code: 'OC', name: 'Oceania' },
  'SA': { code: 'SA', name: 'South America' },
};

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  'AD': 'EU', 'AE': 'AS', 'AF': 'AS', 'AG': 'NA', 'AI': 'NA', 'AL': 'EU', 'AM': 'AS', 'AO': 'AF',
  'AQ': 'AN', 'AR': 'SA', 'AS': 'OC', 'AT': 'EU', 'AU': 'OC', 'AW': 'NA', 'AX': 'EU', 'AZ': 'AS',
  'BA': 'EU', 'BB': 'NA', 'BD': 'AS', 'BE': 'EU', 'BF': 'AF', 'BG': 'EU', 'BH': 'AS', 'BI': 'AF',
  'BJ': 'AF', 'BL': 'NA', 'BM': 'NA', 'BN': 'AS', 'BO': 'SA', 'BQ': 'NA', 'BR': 'SA', 'BS': 'NA',
  'BT': 'AS', 'BV': 'AN', 'BW': 'AF', 'BY': 'EU', 'BZ': 'NA', 'CA': 'NA', 'CC': 'AS', 'CD': 'AF',
  'CF': 'AF', 'CG': 'AF', 'CH': 'EU', 'CI': 'AF', 'CK': 'OC', 'CL': 'SA', 'CM': 'AF', 'CN': 'AS',
  'CO': 'SA', 'CR': 'NA', 'CU': 'NA', 'CV': 'AF', 'CW': 'NA', 'CX': 'AS', 'CY': 'EU', 'CZ': 'EU',
  'DE': 'EU', 'DJ': 'AF', 'DK': 'EU', 'DM': 'NA', 'DO': 'NA', 'DZ': 'AF', 'EC': 'SA', 'EE': 'EU',
  'EG': 'AF', 'EH': 'AF', 'ER': 'AF', 'ES': 'EU', 'ET': 'AF', 'FI': 'EU', 'FJ': 'OC', 'FK': 'SA',
  'FM': 'OC', 'FO': 'EU', 'FR': 'EU', 'GA': 'AF', 'GB': 'EU', 'GD': 'NA', 'GE': 'AS', 'GF': 'SA',
  'GG': 'EU', 'GH': 'AF', 'GI': 'EU', 'GL': 'NA', 'GM': 'AF', 'GN': 'AF', 'GP': 'NA', 'GQ': 'AF',
  'GR': 'EU', 'GS': 'AN', 'GT': 'NA', 'GU': 'OC', 'GW': 'AF', 'GY': 'SA', 'HK': 'AS', 'HM': 'AN',
  'HN': 'NA', 'HR': 'EU', 'HT': 'NA', 'HU': 'EU', 'ID': 'AS', 'IE': 'EU', 'IL': 'AS', 'IM': 'EU',
  'IN': 'AS', 'IO': 'AS', 'IQ': 'AS', 'IR': 'AS', 'IS': 'EU', 'IT': 'EU', 'JE': 'EU', 'JM': 'NA',
  'JO': 'AS', 'JP': 'AS', 'KE': 'AF', 'KG': 'AS', 'KH': 'AS', 'KI': 'OC', 'KM': 'AF', 'KN': 'NA',
  'KP': 'AS', 'KR': 'AS', 'KW': 'AS', 'KY': 'NA', 'KZ': 'AS', 'LA': 'AS', 'LB': 'AS', 'LC': 'NA',
  'LI': 'EU', 'LK': 'AS', 'LR': 'AF', 'LS': 'AF', 'LT': 'EU', 'LU': 'EU', 'LV': 'EU', 'LY': 'AF',
  'MA': 'AF', 'MC': 'EU', 'MD': 'EU', 'ME': 'EU', 'MF': 'NA', 'MG': 'AF', 'MH': 'OC', 'MK': 'EU',
  'ML': 'AF', 'MM': 'AS', 'MN': 'AS', 'MO': 'AS', 'MP': 'OC', 'MQ': 'NA', 'MR': 'AF', 'MS': 'NA',
  'MT': 'EU', 'MU': 'AF', 'MV': 'AS', 'MW': 'AF', 'MX': 'NA', 'MY': 'AS', 'MZ': 'AF', 'NA': 'AF',
  'NC': 'OC', 'NE': 'AF', 'NF': 'OC', 'NG': 'AF', 'NI': 'NA', 'NL': 'EU', 'NO': 'EU', 'NP': 'AS',
  'NR': 'OC', 'NU': 'OC', 'NZ': 'OC', 'OM': 'AS', 'PA': 'NA', 'PE': 'SA', 'PF': 'OC', 'PG': 'OC',
  'PH': 'AS', 'PK': 'AS', 'PL': 'EU', 'PM': 'NA', 'PN': 'OC', 'PR': 'NA', 'PS': 'AS', 'PT': 'EU',
  'PW': 'OC', 'PY': 'SA', 'QA': 'AS', 'RE': 'AF', 'RO': 'EU', 'RS': 'EU', 'RU': 'EU', 'RW': 'AF',
  'SA': 'AS', 'SB': 'OC', 'SC': 'AF', 'SD': 'AF', 'SE': 'EU', 'SG': 'AS', 'SH': 'AF', 'SI': 'EU',
  'SJ': 'EU', 'SK': 'EU', 'SL': 'AF', 'SM': 'EU', 'SN': 'AF', 'SO': 'AF', 'SR': 'SA', 'SS': 'AF',
  'ST': 'AF', 'SV': 'NA', 'SX': 'NA', 'SY': 'AS', 'SZ': 'AF', 'TC': 'NA', 'TD': 'AF', 'TF': 'AN',
  'TG': 'AF', 'TH': 'AS', 'TJ': 'AS', 'TK': 'OC', 'TL': 'AS', 'TM': 'AS', 'TN': 'AF', 'TO': 'OC',
  'TR': 'AS', 'TT': 'NA', 'TV': 'OC', 'TW': 'AS', 'TZ': 'AF', 'UA': 'EU', 'UG': 'AF', 'UM': 'OC',
  'US': 'NA', 'UY': 'SA', 'UZ': 'AS', 'VA': 'EU', 'VC': 'NA', 'VE': 'SA', 'VG': 'NA', 'VI': 'NA',
  'VN': 'AS', 'VU': 'OC', 'WF': 'OC', 'WS': 'OC', 'XK': 'EU', 'YE': 'AS', 'YT': 'AF', 'ZA': 'AF',
  'ZM': 'AF', 'ZW': 'AF',
};

export interface CitySearchResult {
  geonameId: number;
  cityName: string;
  regionName: string;
  countryName: string;
  countryCode: string;
  continentCode: string;
  continentName: string;
  displayName: string;
  population: number;
}

export async function searchCitiesGeoNames(query: string, limit: number = 10): Promise<CitySearchResult[]> {
  try {
    const url = new URL(`${GEONAMES_BASE_URL}/searchJSON`);
    url.searchParams.set('q', query);
    url.searchParams.set('featureClass', 'P');
    url.searchParams.set('maxRows', String(Math.min(limit, 50)));
    url.searchParams.set('username', GEONAMES_USERNAME);
    url.searchParams.set('style', 'FULL');
    url.searchParams.set('orderby', 'relevance');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('GeoNames API error:', response.status, response.statusText);
      return [];
    }

    const data: GeoNamesResponse = await response.json();
    
    if (!data.geonames || data.geonames.length === 0) {
      return [];
    }

    return data.geonames.map((city): CitySearchResult => {
      const continentCode = COUNTRY_TO_CONTINENT[city.countryCode] || 'EU';
      const continent = CONTINENT_MAP[continentCode] || { code: 'EU', name: 'Europe' };
      
      return {
        geonameId: city.geonameId,
        cityName: city.name,
        regionName: city.adminName1 || '',
        countryName: city.countryName,
        countryCode: city.countryCode,
        continentCode: continent.code,
        continentName: continent.name,
        displayName: city.adminName1 
          ? `${city.name}, ${city.adminName1}, ${city.countryName}`
          : `${city.name}, ${city.countryName}`,
        population: city.population || 0,
      };
    });
  } catch (error) {
    console.error('Error calling GeoNames API:', error);
    return [];
  }
}
