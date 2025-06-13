import type {
  User as PrismaUser,
  Account as PrismaAccount,
  Session as PrismaSession,
  EmployeeAuthCode as PrismaEmployeeAuthCode,
  SubscriptionTransaction as PrismaSubscriptionTransaction,
  PasswordHistory as PrismaPasswordHistory,
  SecurityQuestion as PrismaSecurityQuestion,
  LoginHistory as PrismaLoginHistory,
  Company as PrismaCompany,
  Subscription as PrismaSubscription,
  CompanyDocument as PrismaCompanyDocument,
  SubscriptionHistory as PrismaSubscriptionHistory,
  Activity as PrismaActivity,
  Bus as PrismaBus,
  Route as PrismaRoute,
  RouteStop as PrismaRouteStop,
  FavoriteRoute as PrismaFavoriteRoute,
  Station as PrismaStation,
  Trip as PrismaTrip,
  Promotion as PrismaPromotion,
  PromotionTrip as PrismaPromotionTrip,
  Reservation as PrismaReservation,
  Payment as PrismaPayment,
  Refund as PrismaRefund,
  Ticket as PrismaTicket,
  Review as PrismaReview,
  Notification as PrismaNotification,
  NotificationPreference as PrismaNotificationPreference,
  DeviceToken as PrismaDeviceToken,
  ActivityLog as PrismaActivityLog,
  // Enums from Prisma client
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
  Gender as PrismaGender,
  IdentificationType as PrismaIdentificationType,
  EmployeeRole as PrismaEmployeeRole,
  EmployeeDepartment as PrismaEmployeeDepartment,
  EmployeePosition as PrismaEmployeePosition,
  DocumentType as PrismaDocumentType,
  SubscriptionStatus as PrismaSubscriptionStatus,
  CompanySize as PrismaCompanySize,
  CompanyStatus as PrismaCompanyStatus,
  SubscriptionTier as PrismaSubscriptionTier,
  ActivityType as PrismaActivityType,
  ActivityStatus as PrismaActivityStatus,
  BusStatus as PrismaBusStatus,
  FuelType as PrismaFuelType,
  RouteStatus as PrismaRouteStatus,
  RouteType as PrismaRouteType,
  StationType as PrismaStationType,
  TripStatus as PrismaTripStatus,
  TripType as PrismaTripType,
  CancellationReason as PrismaCancellationReason,
  DiscountType as PrismaDiscountType,
  ReservationStatus as PrismaReservationStatus,
  PaymentStatus as PrismaPaymentStatus,
  PaymentMethod as PrismaPaymentMethod,
  RefundStatus as PrismaRefundStatus,
  PassengerType as PrismaPassengerType,
  TicketStatus as PrismaTicketStatus,
  NotificationType as PrismaNotificationType,
  NotificationPriority as PrismaNotificationPriority,
  LoyaltyProgram as PrismaLoyaltyProgram,
  Prisma, // Import Prisma namespace for type utilities
} from "@prisma/client";

// Re-export Prisma enums for direct use in components
export type {
  PrismaUserRole as UserRole,
  PrismaUserStatus as UserStatus,
  PrismaGender as Gender,
  PrismaIdentificationType as IdentificationType,
  PrismaEmployeeRole as EmployeeRole,
  PrismaEmployeeDepartment as EmployeeDepartment,
  PrismaEmployeePosition as EmployeePosition,
  PrismaDocumentType as DocumentType,
  PrismaSubscriptionStatus as SubscriptionStatus,
  PrismaCompanySize as CompanySize,
  PrismaCompanyStatus as CompanyStatus,
  PrismaSubscriptionTier as SubscriptionTier,
  PrismaActivityType as ActivityType,
  PrismaActivityStatus as ActivityStatus,
  PrismaBusStatus as BusStatus,
  PrismaFuelType as FuelType,
  PrismaRouteStatus as RouteStatus,
  PrismaRouteType as RouteType,
  PrismaStationType as StationType,
  PrismaTripStatus as TripStatus,
  PrismaTripType as TripType,
  PrismaCancellationReason as CancellationReason,
  PrismaDiscountType as DiscountType,
  PrismaReservationStatus as ReservationStatus,
  PrismaPaymentStatus as PaymentStatus,
  PrismaPaymentMethod as PaymentMethod,
  PrismaRefundStatus as RefundStatus,
  PrismaPassengerType as PassengerType,
  PrismaTicketStatus as TicketStatus,
  PrismaNotificationType as NotificationType,
  PrismaNotificationPriority as NotificationPriority,
  PrismaLoyaltyProgram as LoyaltyProgram,
};

// Define custom types extending Prisma's generated types with includes or computed properties
export interface User extends PrismaUser {
  accounts?: PrismaAccount[];
  sessions?: PrismaSession[];
  employeeAuthCodes?: PrismaEmployeeAuthCode[];
  subscriptionTransactions?: PrismaSubscriptionTransaction[];
  ownedCompanies?: PrismaCompany[];
  employeeAt?: PrismaCompany | null;
  activeCompany?: PrismaCompany | null;
  reservations?: PrismaReservation[];
  tickets?: PrismaTicket[];
  notifications?: PrismaNotification[];
  reviews?: PrismaReview[];
  favorites?: PrismaFavoriteRoute[];
  payments?: PrismaPayment[];
  refunds?: PrismaRefund[];
  deviceTokens?: PrismaDeviceToken[];
  activityLogs?: PrismaActivityLog[];
  loginHistory?: PrismaLoginHistory[];
  securityQuestions?: PrismaSecurityQuestion[];
  passwordHistory?: PrismaPasswordHistory[];
  notificationPreferences?: PrismaNotificationPreference[];
  subscriptions?: PrismaSubscription[];
  company?: PrismaCompany | null;
  employee?: PrismaUser | null;
}

export interface EmployeeAuthCode extends PrismaEmployeeAuthCode {
  employee?: PrismaUser;
}

export interface SubscriptionTransaction extends PrismaSubscriptionTransaction {
  user?: PrismaUser;
  company?: PrismaCompany;
}

export interface PasswordHistory extends PrismaPasswordHistory {
  user?: PrismaUser;
}

export interface SecurityQuestion extends PrismaSecurityQuestion {
  user?: PrismaUser;
}

export interface LoginHistory extends PrismaLoginHistory {
  user?: PrismaUser;
}

export interface Company extends PrismaCompany {
  owner?: PrismaUser;
  employees?: PrismaUser[];
  activeForUsers?: PrismaUser[];
  buses?: PrismaBus[];
  routes?: PrismaRoute[];
  stations?: PrismaStation[];
  trips?: PrismaTrip[];
  reservations?: PrismaReservation[];
  tickets?: PrismaTicket[];
  reviews?: PrismaReview[];
  activities?: PrismaActivity[];
  promotions?: PrismaPromotion[];
  payments?: PrismaPayment[];
  refunds?: PrismaRefund[];
  documents?: PrismaCompanyDocument[];
  subscriptionTransactions?: PrismaSubscriptionTransaction[];
  subscriptionHistory?: PrismaSubscriptionHistory[];
  subscriptions?: PrismaSubscription[];
  totalEmployees?: number; // Example of computed field
  totalBuses?: number; // Example of computed field
  totalRevenue: number; // Changed to non-optional to match error message's implied base type
  loyaltyProgram?: PrismaLoyaltyProgram | null; // Added
}

export interface Subscription extends PrismaSubscription {
  company?: PrismaCompany;
  user?: PrismaUser;
}

export interface CompanyDocument extends PrismaCompanyDocument {
  company?: PrismaCompany;
}

export interface SubscriptionHistory extends PrismaSubscriptionHistory {
  company?: PrismaCompany;
}

export interface Activity extends PrismaActivity {
  user?: PrismaUser | null;
  company?: PrismaCompany | null;
}

export interface Bus extends PrismaBus {
  company?: PrismaCompany;
  trips?: PrismaTrip[];
}

export interface Route extends PrismaRoute {
  company?: PrismaCompany | null;
  stops?: PrismaRouteStop[];
  trips?: PrismaTrip[];
  favorites?: PrismaFavoriteRoute[];
  promotions?: PrismaPromotionTrip[];
}

export interface RouteStop extends PrismaRouteStop {
  route?: PrismaRoute;
}

export interface FavoriteRoute extends PrismaFavoriteRoute {
  user?: PrismaUser;
  route?: PrismaRoute;
}

export interface Station extends PrismaStation {
  company?: PrismaCompany;
}

export interface Trip extends PrismaTrip {
  route?: PrismaRoute;
  bus?: PrismaBus;
  company?: PrismaCompany;
  reservations?: PrismaReservation[];
  tickets?: PrismaTicket[];
  promotions?: PrismaPromotionTrip[];
  // Assuming driver and conductor are Users with EmployeeRole
  driver?: PrismaUser | null;
  conductor?: PrismaUser | null;
  driverId?: string; // Added
  conductorId?: string; // Added
  availableSeats: number; // Computed property for frontend
}

export interface Promotion extends PrismaPromotion {
  company?: PrismaCompany;
  targetRoutes?: PrismaRoute[];
  targetTrips?: PrismaPromotionTrip[];
}

export interface PromotionTrip extends PrismaPromotionTrip {
  promotion?: PrismaPromotion;
  trip?: PrismaTrip;
}

export interface Reservation extends PrismaReservation {
  trip?: PrismaTrip;
  user?: PrismaUser | null;
  company?: PrismaCompany;
  tickets?: PrismaTicket[];
  payments?: PrismaPayment[];
  refunds?: PrismaRefund[];
}

export interface Payment extends PrismaPayment {
  user?: PrismaUser | null;
  company?: PrismaCompany;
  reservation?: PrismaReservation | null;
  refunds?: PrismaRefund[];
}

export interface Refund extends PrismaRefund {
  user?: PrismaUser;
  company?: PrismaCompany;
  reservation?: PrismaReservation;
  payment?: PrismaPayment;
}

export interface Ticket extends PrismaTicket {
  trip?: PrismaTrip;
  user?: PrismaUser | null;
  company?: PrismaCompany;
  reservation?: PrismaReservation | null;
}

export interface Review extends PrismaReview {
  user?: PrismaUser;
  company?: PrismaCompany;
}

export interface Notification extends PrismaNotification {
  user?: PrismaUser;
}

export interface NotificationPreference extends PrismaNotificationPreference {
  user?: PrismaUser;
}

export interface DeviceToken extends PrismaDeviceToken {
  user?: PrismaUser;
}

export interface ActivityLog extends PrismaActivityLog {
  user?: PrismaUser;
}

// --- Form Types (Updated to reflect new schema fields) ---

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  countryCode: string;
  role: PrismaUserRole; // For client registration
}

export interface CompanyForm {
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  country: string;
  city: string;
  commune?: string;
  website?: string;
  postalCode?: string;
  licenseNumber: string;
  taxId?: string;
  foundedYear?: number;
  size?: PrismaCompanySize;
  operatingCountries?: string[];
  primaryRoutes?: any; // Adjust as needed for specific JSON structure
  services?: string[];
  vehicleTypes?: string[];
  businessHours?: any; // Adjust as needed for specific JSON structure
  socialMedia?: any; // Adjust as needed for specific JSON structure
  certifications?: string[];
  bookingSettings?: any; // Adjust as needed for specific JSON structure
  paymentMethods?: PrismaPaymentMethod[];
  cancellationPolicy?: string;
  refundPolicy?: string;
  termsAndConditions?: string;
  legalStatus?: string;
  insuranceProvider?: string;
  insurancePolicy?: string;
  insuranceExpiry?: Date;
  safetyRating?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankCode?: string;
  swiftCode?: string;
}

export interface BusForm {
  plateNumber: string;
  model: string;
  brand?: string;
  capacity: number;
  year?: number;
  status?: PrismaBusStatus;
  mileage?: number;
  color?: string;
  fuelType?: PrismaFuelType;
  features?: string[];
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  insuranceExpiry?: Date;
  technicalControlExpiry?: Date;
  registrationExpiry?: Date;
  purchaseDate?: Date;
  purchasePrice?: number;
}

export interface RouteForm {
  name: string;
  departureLocation: string;
  arrivalLocation: string;
  departureCountry: string;
  arrivalCountry: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  description?: string;
  isInternational?: boolean;
  status?: PrismaRouteStatus;
  routeType?: PrismaRouteType;
  difficulty?: string;
  scenicRating?: number;
  roadCondition?: string;
  dynamicPricing?: boolean;
  peakSeasonMultiplier?: number;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  minimumBookingTime?: number;
  maximumBookingDays?: number;
  waypoints?: any[]; // Adjust as needed for specific JSON structure
  tollFees?: number;
  borderCrossings?: string[];
  departureCoordinates?: any; // Adjust as needed for specific JSON structure
  arrivalCoordinates?: any; // Adjust as needed for specific JSON structure
  routePath?: any; // GeoJSON for route visualization
  stops?: Omit<
    PrismaRouteStop,
    "id" | "routeId" | "route" | "createdAt" | "updatedAt"
  >[];
}

export interface RouteStopForm {
  name: string;
  country: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  order: number;
  estimatedArrival: number;
  stopDuration?: number;
  isOptional?: boolean;
  facilities?: string[];
  description?: string;
  contactPhone?: string;
  isActive?: boolean;
  priceAdjustment?: number;
}

export interface TripForm {
  routeId: string;
  busId: string;
  departureTime: Date;
  arrivalTime: Date;
  basePrice: number;
  currentPrice: number;
  availableSeats: number;
  status?: PrismaTripStatus;
  tripType?: PrismaTripType;
  services?: string[];
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  isArchived?: boolean;
  boardingStartTime?: Date;
  boardingEndTime?: Date;
  driverId?: string;
  conductorId?: string;
}

export interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  role: PrismaEmployeeRole;
  department?: PrismaEmployeeDepartment;
  position?: PrismaEmployeePosition;
  hireDate?: Date;
  salary?: number;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  employeeNotes?: string;
  education?: string;
  skills?: string[];
  languages?: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  driverLicenseNumber?: string;
  passportNumber?: string;
  socialSecurityNumber?: string;
  licenseExpiry?: Date;
}

export interface ReservationForm {
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumbers: number[];
  totalAmount: number;
  tripId: string;
  userId?: string;
  companyId: string;
  paymentMethod?: PrismaPaymentMethod;
  bookingSource?: string;
  specialRequests?: string;
  emergencyContact?: string;
  passengerCount?: number;
  passengerDetails?: any; // Adjust as needed for specific JSON structure
  promotionCode?: string;
}

export interface PaymentForm {
  amount: number;
  currency: string;
  method: PrismaPaymentMethod;
  reference?: string;
  processorId?: string;
  processorFee?: number;
  metadata?: any; // Adjust as needed for specific JSON structure
  receiptUrl?: string;
  userId?: string;
  companyId: string;
  reservationId?: string;
}

export interface RefundForm {
  amount: number;
  reason: string;
  status?: PrismaRefundStatus;
  processorId?: string;
  processorFee?: number;
  metadata?: any; // Adjust as needed for specific JSON structure
  notes?: string;
  userId: string;
  companyId: string;
  reservationId: string;
  paymentId: string;
}

export interface TicketForm {
  ticketNumber: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumber: number;
  price: number;
  status?: PrismaTicketStatus;
  qrCode?: string;
  qrHash?: string;
  barcode?: string;
  issueDate?: Date;
  validUntil?: Date;
  usedAt?: Date;
  verificationCode?: string;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  passengerType?: PrismaPassengerType;
  passengerDetails?: any; // Adjust as needed for specific JSON structure
  boardingPoint?: string;
  alightingPoint?: string;
  hasLuggage?: boolean;
  luggageDetails?: any; // Adjust as needed for specific JSON structure
  specialServices?: string[];
  tripId: string;
  userId?: string;
  companyId: string;
  reservationId?: string;
}

export interface ReviewForm {
  rating: number;
  comment?: string;
  serviceRating?: number;
  comfortRating?: number;
  punctualityRating?: number;
  driverRating?: number;
  isPublic?: boolean;
  tripDate?: Date;
  routeName?: string;
  tripId?: string;
  userId: string;
  companyId: string;
}

export interface NotificationPreferenceForm {
  type: PrismaNotificationType;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  inApp?: boolean;
  userId: string;
}

export interface DeviceTokenForm {
  token: string;
  device?: string;
  platform?: string;
  appVersion?: string;
  lastUsed?: Date;
  userId: string;
}

export interface ActivityLogForm {
  action: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  duration?: number;
  sessionId?: string;
  deviceInfo?: any; // Adjust as needed for specific JSON structure
  location?: any; // Adjust as needed for specific JSON structure
  entityType?: string;
  entityId?: string;
  userId: string;
}

export interface CompanyDocumentForm {
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  isVerified?: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  expiryDate?: Date;
  companyId: string;
}

export interface SubscriptionForm {
  tier: PrismaSubscriptionTier;
  status?: PrismaSubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  amount?: number;
  currency?: string;
  period?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  paymentReference?: string;
  transactionId?: string;
  companyId: string;
  userId: string;
}

export interface PromotionForm {
  name: string;
  description?: string;
  code: string;
  discountType?: PrismaDiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  usageLimit?: number;
  perUserLimit?: number;
  targetUserType?: PrismaUserRole;
  image?: string;
  termsAndConditions?: string;
  companyId: string;
  targetRouteIds?: string[]; // For linking to routes
  targetTripIds?: string[]; // For linking to trips
}

export interface StationForm {
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  stationType?: PrismaStationType;
  facilities?: string[];
  isActive?: boolean;
  phone?: string;
  email?: string;
  manager?: string;
  openingHours?: any; // Adjust as needed for specific JSON structure
  capacity?: number;
  hasWifi?: boolean;
  hasRestrooms?: boolean;
  hasWaitingRoom?: boolean;
  hasTicketCounter?: boolean;
  hasCafeteria?: boolean;
  images?: string[];
  virtualTour?: string;
  companyId: string;
}

// --- Utility Types ---
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// --- Dashboard Stats Types (Updated to reflect new schema fields) ---
export interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalBuses: number;
  totalRoutes: number;
  totalTrips: number;
  totalReservations: number;
  totalRevenue: number;
  activeTrips: number;
  pendingReservations: number;
  recentActivities: Activity[]; // Using the extended Activity type
  // Add more specific stats as needed based on your dashboard requirements
  companyStats?: {
    active: number;
    pending: number;
    suspended: number;
  };
  tripStats?: {
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  paymentStats?: {
    completed: number;
    pending: number;
    failed: number;
  };
  userStats?: {
    clients: number;
    employees: number;
    patrons: number;
  };
}

// --- Search and Filter Types (Updated to reflect new schema fields) ---

export interface SearchFilters {
  from?: string; // Corresponds to departureLocation
  to?: string; // Corresponds to arrivalLocation
  date?: Date; // For single date input (YYYY-MM-DD)
  minPrice?: number;
  maxPrice?: number;
  company?: string; // Company ID
  sortBy?: string;
  departureCountry?: string; // New
  arrivalCountry?: string; // New
  page?: number;
  limit?: number;
}

// --- Specific Payload Types for Prisma Includes ---
export type TripWithDetails = Prisma.TripGetPayload<{
  include: {
    route: {
      select: {
        id: true;
        name: true;
        departureLocation: true;
        arrivalLocation: true;
        departureCountry: true;
        arrivalCountry: true;
        distance: true;
        estimatedDuration: true;
        basePrice: true;
        departureCoordinates: true; // Changed from coordinates
        arrivalCoordinates: true; // Added
      };
    };
    bus: {
      select: {
        id: true;
        model: true;
        plateNumber: true;
        brand: true;
        capacity: true;
        features: true;
        // Removed 'type' as it's not in schema
      };
    };
    company: {
      select: {
        id: true;
        name: true;
        logo: true;
        rating: true;
      };
    };
    _count: {
      select: {
        reservations: true;
        tickets: true;
      };
    };
  };
}>;

export type TripWithReservationsAndUsers = Prisma.TripGetPayload<{
  include: {
    route: true;
    reservations: {
      include: { user: true };
    };
  };
}>;

export type UserProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    phone: true;
    countryCode: true;
    role: true;
    status: true;
    firstName: true;
    lastName: true;
    country: true;
    city: true;
    commune: true;
    address: true;
    dateOfBirth: true;
    gender: true;
    nationality: true;
    idNumber: true;
    idType: true;
    idExpiryDate: true;
    department: true;
    position: true;
    hireDate: true;
    salary: true;
    emergencyContact: true;
    emergencyPhone: true;
    emergencyRelation: true;
    employeeNotes: true;
    education: true;
    skills: true;
    languages: true;
    bankName: true;
    bankAccountNumber: true;
    bankAccountName: true;
    lastLogin: true;
    loginCount: true;
    marketingConsent: true;
    referralCode: true;
    referredBy: true;
    referralCount: true;
    twoFactorEnabled: true;
    twoFactorSecret: true;
    employeeRole: true;
    company: {
      select: {
        id: true;
        name: true;
      };
    };
    activeCompany: {
      select: {
        id: true;
        name: true;
      };
    };
    notificationPreferences: true;
    securityQuestions: true;
    passwordHistory: true;
    loginHistory: true;
    deviceTokens: true;
  };
}>;

export type CompanyWithDetails = Prisma.CompanyGetPayload<{
  include: {
    buses: true;
    routes: true;
    trips: true;
    employees: true; // These are Users with employee roles
    owner: true;
    stations: true;
    documents: true;
    subscriptions: true;
    subscriptionHistory: true;
    subscriptionTransactions: true;
    promotions: true;
    reviews: true;
    activities: true;
    payments: true;
    refunds: true;
  };
}>;

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string; // OpenWeatherMap icon code
  city: string;
  country: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
