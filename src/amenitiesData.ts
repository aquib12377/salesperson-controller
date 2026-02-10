// src/amenitiesData.ts
// Amenities configuration with image mappings

export interface AmenityConfig {
  id: string;
  name: string;
  images: string[];       // Image filenames in /amenities/ folder
  imageLabels: string[];  // Labels for each image button (like direction buttons)
  ledCount: number;
  color: { r: number; g: number; b: number };
}

// Amenities with images first, then without
export const AMENITIES_CONFIG: AmenityConfig[] = [
  {
    id: 'pickle-ball',
    name: 'Pickle Ball Court',
    images: ['tennis1.jpg', 'tennis2.jpg'],
    imageLabels: ['View 1', 'View 2'],
    ledCount: 80,
    color: { r: 0, g: 255, b: 100 }
  },
  {
    id: 'indoor-games',
    name: 'Multipurpose Indoor Games',
    images: ['pickleball1.jpg', 'pickleball2.jpg', 'pickleball3.jpg', 'pickleball4.jpg'],
    imageLabels: ['View 1', 'View 2', 'View 3', 'View 4'],
    ledCount: 30,
    color: { r: 100, g: 200, b: 255 }
  },
  {
    id: 'conference',
    name: 'Conference Room',
    images: ['conference1.jpg'],
    imageLabels: ['View 1'],
    ledCount: 45,
    color: { r: 255, g: 255, b: 100 }
  },
  {
    id: 'sitout',
    name: 'Sitout Space',
    images: ['sitout1.jpg', 'sitout2.jpg', 'sitout3.jpg'],
    imageLabels: ['View 1', 'View 2', 'View 3'],
    ledCount: 90,
    color: { r: 200, g: 255, b: 150 }
  },
  {
    id: 'toddlers',
    name: 'Art & Craft / Toddlers Area',
    images: ['toddlers1.jpg'],
    imageLabels: ['View 1'],
    ledCount: 25,
    color: { r: 255, g: 180, b: 100 }
  },
  {
    id: 'fitness',
    name: 'Fitness Centre',
    images: ['gym1.jpg', 'gym2.jpg', 'gym3.jpg', 'gym4.jpg'],
    imageLabels: ['View 1', 'View 2', 'View 3', 'View 4'],
    ledCount: 35,
    color: { r: 255, g: 80, b: 80 }
  },
  {
    id: 'waiting',
    name: 'Waiting Lounge',
    images: ['waiting1.jpg', 'waiting2.jpg', 'waiting3.jpg'],
    imageLabels: ['View 1', 'View 2', 'View 3'],
    ledCount: 40,
    color: { r: 180, g: 255, b: 180 }
  },
  // Amenities without images (LED-only control)
  {
    id: 'lounge',
    name: 'Lounge',
    images: [],
    imageLabels: [],
    ledCount: 20,
    color: { r: 255, g: 255, b: 255 }
  },
  {
    id: 'toilet-male',
    name: 'Toilet (Male)',
    images: [],
    imageLabels: [],
    ledCount: 50,
    color: { r: 100, g: 150, b: 255 }
  },
  {
    id: 'toilet-female',
    name: 'Toilet (Female)',
    images: [],
    imageLabels: [],
    ledCount: 55,
    color: { r: 255, g: 150, b: 200 }
  },
  {
    id: 'handicap-toilet',
    name: 'Handicap Toilet',
    images: [],
    imageLabels: [],
    ledCount: 60,
    color: { r: 200, g: 200, b: 255 }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    images: [],
    imageLabels: [],
    ledCount: 65,
    color: { r: 255, g: 200, b: 80 }
  },
  {
    id: 'janitor',
    name: 'Janitor / Cleaning',
    images: [],
    imageLabels: [],
    ledCount: 70,
    color: { r: 150, g: 150, b: 150 }
  },
  {
    id: 'banquet',
    name: 'Banquet Hall',
    images: [],
    imageLabels: [],
    ledCount: 75,
    color: { r: 255, g: 215, b: 0 }
  },
  {
    id: 'walkway',
    name: 'Walkway',
    images: [],
    imageLabels: [],
    ledCount: 85,
    color: { r: 255, g: 255, b: 255 }
  },
  {
    id: 'lawn',
    name: 'Lawn',
    images: [],
    imageLabels: [],
    ledCount: 95,
    color: { r: 100, g: 255, b: 100 }
  },
  {
    id: 'meditation',
    name: 'Meditation Area',
    images: [],
    imageLabels: [],
    ledCount: 100,
    color: { r: 150, g: 100, b: 255 }
  }
];

// Helper: Get amenity by ID
export function getAmenityById(id: string): AmenityConfig | undefined {
  return AMENITIES_CONFIG.find(a => a.id === id);
}

// Helper: Get only amenities that have images
export function getAmenitiesWithImages(): AmenityConfig[] {
  return AMENITIES_CONFIG.filter(a => a.images.length > 0);
}

// Helper: Get image path for an amenity image
export function getAmenityImagePath(filename: string): string {
  return `/amenities/${filename}`;
}