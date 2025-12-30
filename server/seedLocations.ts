import { db } from "./db";
import { locations } from "@shared/schema";
import { eq } from "drizzle-orm";

interface LocationSeed {
  name: string;
  type: "continent" | "country" | "region" | "town";
  isoCode?: string;
  children?: LocationSeed[];
}

const locationData: LocationSeed[] = [
  {
    name: "Africa",
    type: "continent",
    isoCode: "AF",
    children: [
      {
        name: "Nigeria",
        type: "country",
        isoCode: "NG",
        children: [
          {
            name: "Lagos State",
            type: "region",
            children: [
              { name: "Lagos", type: "town" },
              { name: "Ikeja", type: "town" },
              { name: "Victoria Island", type: "town" },
              { name: "Lekki", type: "town" },
            ],
          },
          {
            name: "Abuja FCT",
            type: "region",
            children: [
              { name: "Abuja", type: "town" },
              { name: "Garki", type: "town" },
            ],
          },
          {
            name: "Kano State",
            type: "region",
            children: [
              { name: "Kano", type: "town" },
            ],
          },
        ],
      },
      {
        name: "South Africa",
        type: "country",
        isoCode: "ZA",
        children: [
          {
            name: "Gauteng",
            type: "region",
            children: [
              { name: "Johannesburg", type: "town" },
              { name: "Pretoria", type: "town" },
            ],
          },
          {
            name: "Western Cape",
            type: "region",
            children: [
              { name: "Cape Town", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Kenya",
        type: "country",
        isoCode: "KE",
        children: [
          {
            name: "Nairobi County",
            type: "region",
            children: [
              { name: "Nairobi", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Ghana",
        type: "country",
        isoCode: "GH",
        children: [
          {
            name: "Greater Accra",
            type: "region",
            children: [
              { name: "Accra", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Egypt",
        type: "country",
        isoCode: "EG",
        children: [
          {
            name: "Cairo Governorate",
            type: "region",
            children: [
              { name: "Cairo", type: "town" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Europe",
    type: "continent",
    isoCode: "EU",
    children: [
      {
        name: "United Kingdom",
        type: "country",
        isoCode: "GB",
        children: [
          {
            name: "England",
            type: "region",
            children: [
              { name: "London", type: "town" },
              { name: "Manchester", type: "town" },
              { name: "Birmingham", type: "town" },
              { name: "Liverpool", type: "town" },
            ],
          },
          {
            name: "Scotland",
            type: "region",
            children: [
              { name: "Edinburgh", type: "town" },
              { name: "Glasgow", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Germany",
        type: "country",
        isoCode: "DE",
        children: [
          {
            name: "Bavaria",
            type: "region",
            children: [
              { name: "Munich", type: "town" },
            ],
          },
          {
            name: "Berlin",
            type: "region",
            children: [
              { name: "Berlin", type: "town" },
            ],
          },
        ],
      },
      {
        name: "France",
        type: "country",
        isoCode: "FR",
        children: [
          {
            name: "Île-de-France",
            type: "region",
            children: [
              { name: "Paris", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Spain",
        type: "country",
        isoCode: "ES",
        children: [
          {
            name: "Community of Madrid",
            type: "region",
            children: [
              { name: "Madrid", type: "town" },
            ],
          },
          {
            name: "Catalonia",
            type: "region",
            children: [
              { name: "Barcelona", type: "town" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "North America",
    type: "continent",
    isoCode: "NA",
    children: [
      {
        name: "United States",
        type: "country",
        isoCode: "US",
        children: [
          {
            name: "California",
            type: "region",
            children: [
              { name: "Los Angeles", type: "town" },
              { name: "San Francisco", type: "town" },
              { name: "San Diego", type: "town" },
            ],
          },
          {
            name: "New York",
            type: "region",
            children: [
              { name: "New York City", type: "town" },
              { name: "Buffalo", type: "town" },
            ],
          },
          {
            name: "Texas",
            type: "region",
            children: [
              { name: "Houston", type: "town" },
              { name: "Dallas", type: "town" },
              { name: "Austin", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Canada",
        type: "country",
        isoCode: "CA",
        children: [
          {
            name: "Ontario",
            type: "region",
            children: [
              { name: "Toronto", type: "town" },
              { name: "Ottawa", type: "town" },
            ],
          },
          {
            name: "British Columbia",
            type: "region",
            children: [
              { name: "Vancouver", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Mexico",
        type: "country",
        isoCode: "MX",
        children: [
          {
            name: "Mexico City",
            type: "region",
            children: [
              { name: "Mexico City", type: "town" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "South America",
    type: "continent",
    isoCode: "SA",
    children: [
      {
        name: "Brazil",
        type: "country",
        isoCode: "BR",
        children: [
          {
            name: "São Paulo State",
            type: "region",
            children: [
              { name: "São Paulo", type: "town" },
            ],
          },
          {
            name: "Rio de Janeiro State",
            type: "region",
            children: [
              { name: "Rio de Janeiro", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Argentina",
        type: "country",
        isoCode: "AR",
        children: [
          {
            name: "Buenos Aires Province",
            type: "region",
            children: [
              { name: "Buenos Aires", type: "town" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Asia",
    type: "continent",
    isoCode: "AS",
    children: [
      {
        name: "China",
        type: "country",
        isoCode: "CN",
        children: [
          {
            name: "Beijing Municipality",
            type: "region",
            children: [
              { name: "Beijing", type: "town" },
            ],
          },
          {
            name: "Shanghai Municipality",
            type: "region",
            children: [
              { name: "Shanghai", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Japan",
        type: "country",
        isoCode: "JP",
        children: [
          {
            name: "Tokyo Prefecture",
            type: "region",
            children: [
              { name: "Tokyo", type: "town" },
            ],
          },
          {
            name: "Osaka Prefecture",
            type: "region",
            children: [
              { name: "Osaka", type: "town" },
            ],
          },
        ],
      },
      {
        name: "India",
        type: "country",
        isoCode: "IN",
        children: [
          {
            name: "Maharashtra",
            type: "region",
            children: [
              { name: "Mumbai", type: "town" },
            ],
          },
          {
            name: "Delhi",
            type: "region",
            children: [
              { name: "New Delhi", type: "town" },
            ],
          },
        ],
      },
      {
        name: "United Arab Emirates",
        type: "country",
        isoCode: "AE",
        children: [
          {
            name: "Dubai",
            type: "region",
            children: [
              { name: "Dubai", type: "town" },
            ],
          },
          {
            name: "Abu Dhabi",
            type: "region",
            children: [
              { name: "Abu Dhabi", type: "town" },
            ],
          },
        ],
      },
      {
        name: "Saudi Arabia",
        type: "country",
        isoCode: "SA",
        children: [
          {
            name: "Riyadh Province",
            type: "region",
            children: [
              { name: "Riyadh", type: "town" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Oceania",
    type: "continent",
    isoCode: "OC",
    children: [
      {
        name: "Australia",
        type: "country",
        isoCode: "AU",
        children: [
          {
            name: "New South Wales",
            type: "region",
            children: [
              { name: "Sydney", type: "town" },
            ],
          },
          {
            name: "Victoria",
            type: "region",
            children: [
              { name: "Melbourne", type: "town" },
            ],
          },
        ],
      },
      {
        name: "New Zealand",
        type: "country",
        isoCode: "NZ",
        children: [
          {
            name: "Auckland Region",
            type: "region",
            children: [
              { name: "Auckland", type: "town" },
            ],
          },
        ],
      },
    ],
  },
];

async function insertLocation(location: LocationSeed, parentId: string | null, sortOrder: number): Promise<void> {
  const [inserted] = await db
    .insert(locations)
    .values({
      name: location.name,
      type: location.type,
      parentId: parentId,
      isoCode: location.isoCode || null,
      sortOrder: sortOrder,
    })
    .returning();

  if (location.children) {
    for (let i = 0; i < location.children.length; i++) {
      await insertLocation(location.children[i], inserted.id, i);
    }
  }
}

export async function seedLocations(): Promise<void> {
  const existingLocations = await db.select().from(locations).limit(1);
  
  if (existingLocations.length > 0) {
    console.log("Locations already seeded, skipping...");
    return;
  }

  console.log("Seeding locations...");
  
  for (let i = 0; i < locationData.length; i++) {
    await insertLocation(locationData[i], null, i);
  }

  console.log("Locations seeded successfully!");
}

if (require.main === module) {
  seedLocations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error seeding locations:", err);
      process.exit(1);
    });
}
