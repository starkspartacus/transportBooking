export interface Reservation {
  id: string;
  reservationNumber: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string | null;
  seatNumbers: number[];
  totalAmount: number;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  tripId: string;
  userId?: string | null;
  companyId: string;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  specialRequests?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
  NO_SHOW = "NO_SHOW",
  CHECKED_IN = "CHECKED_IN",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  DISPUTED = "DISPUTED",
  EXPIRED = "EXPIRED",
  PAID = "PAID",
}
