export interface Trip {
  id: string;
  departureTime: Date;
  arrivalTime: Date;
  basePrice: number;
  currentPrice: number;
  availableSeats: number;
  status: TripStatus;
  departureCity?: string | null;
  arrivalCity?: string | null;
  routeId: string;
  busId: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TripStatus {
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  BOARDING = "BOARDING",
  DEPARTED = "DEPARTED",
  IN_TRANSIT = "IN_TRANSIT",
  ARRIVED = "ARRIVED",
  CANCELLED = "CANCELLED",
  DELAYED = "DELAYED",
  COMPLETED = "COMPLETED",
  MAINTENANCE = "MAINTENANCE",
}

export enum TripType {
  STANDARD = "STANDARD",
  EXPRESS = "EXPRESS",
  VIP = "VIP",
  ECONOMIQUE = "ECONOMIQUE",
  NUIT = "NUIT",
}
