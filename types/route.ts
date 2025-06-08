export interface Route {
  id: string;
  name: string;
  departureLocation: string;
  arrivalLocation: string;
  departureCountry: string;
  arrivalCountry: string;
  distance: number;
  estimatedDuration: number; // en minutes
  basePrice: number;
  description?: string;
  isInternational: boolean;
  status: string;
  routeType: string;
  difficulty?: string;
  scenicRating?: number;
  roadCondition?: string;
  dynamicPricing: boolean;
  peakSeasonMultiplier?: number;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  minimumBookingTime?: number;
  maximumBookingDays?: number;
  waypoints?: any[];
  tollFees?: number;
  borderCrossings?: string[];
  popularityScore?: number;
  searchCount?: number;
  bookingCount?: number;
  departureCoordinates?: any;
  arrivalCoordinates?: any;
  routePath?: any;
  companyId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
