// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "ADMIN",
  PATRON = "PATRON",
  GESTIONNAIRE = "GESTIONNAIRE",
  CAISSIER = "CAISSIER",
  CLIENT = "CLIENT",
}

// Company Types
export interface Company {
  id: string;
  name: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  logo?: string;
  status: CompanyStatus;
  isActive: boolean;
  patronId: string;
  createdAt: Date;
  updatedAt: Date;
  buses?: Bus[];
  routes?: Route[];
  employees?: Employee[];
  trips?: Trip[];
}

export enum CompanyStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

// Bus Types
export interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  capacity: number;
  type: BusType;
  status: BusStatus;
  isActive: boolean;
  companyId: string;
  company?: Company;
  features?: string[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  trips?: Trip[];
}

export enum BusType {
  STANDARD = "STANDARD",
  VIP = "VIP",
  LUXURY = "LUXURY",
  SLEEPER = "SLEEPER",
}

export enum BusStatus {
  AVAILABLE = "AVAILABLE",
  IN_TRANSIT = "IN_TRANSIT",
  MAINTENANCE = "MAINTENANCE",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

// Route Types
export interface Route {
  id: string;
  name: string;
  description?: string;
  departureLocation: string;
  arrivalLocation: string;
  departureCountry?: string;
  arrivalCountry?: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  isInternational: boolean;
  status: RouteStatus;
  isActive: boolean;
  companyId: string;
  company?: Company;
  stops?: RouteStop[];
  trips?: Trip[];
  totalTrips?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum RouteStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
}

export interface RouteStop {
  id: string;
  name: string;
  location: string;
  order: number;
  estimatedArrival: number;
  price: number;
  routeId: string;
  route?: Route;
}

// Employee Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  isActive: boolean;
  companyId: string;
  company?: Company;
  hireDate: Date;
  salary?: number;
  address?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmployeeRole {
  DRIVER = "DRIVER",
  CONDUCTOR = "CONDUCTOR",
  MECHANIC = "MECHANIC",
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
}

export enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  SUSPENDED = "SUSPENDED",
}

// Trip Types
export interface Trip {
  id: string;
  departureDate: Date;
  departureTime: string;
  arrivalDate: Date;
  arrivalTime: string;
  availableSeats: number;
  price: number;
  status: TripStatus;
  isActive: boolean;
  routeId: string;
  route?: Route;
  busId: string;
  bus?: Bus;
  companyId: string;
  company?: Company;
  driverId?: string;
  driver?: Employee;
  conductorId?: string;
  conductor?: Employee;
  reservations?: Reservation[];
  createdAt: Date;
  updatedAt: Date;
}

export enum TripStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DELAYED = "DELAYED",
}

// Reservation Types
export interface Reservation {
  id: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumbers: string[];
  totalAmount: number;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  tripId: string;
  trip?: Trip;
  userId?: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

// Activity Types
export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum ActivityType {
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  COMPANY_CREATED = "COMPANY_CREATED",
  COMPANY_UPDATED = "COMPANY_UPDATED",
  COMPANY_APPROVED = "COMPANY_APPROVED",
  COMPANY_REJECTED = "COMPANY_REJECTED",
  BUS_CREATED = "BUS_CREATED",
  BUS_UPDATED = "BUS_UPDATED",
  BUS_DELETED = "BUS_DELETED",
  ROUTE_CREATED = "ROUTE_CREATED",
  ROUTE_UPDATED = "ROUTE_UPDATED",
  ROUTE_DELETED = "ROUTE_DELETED",
  TRIP_CREATED = "TRIP_CREATED",
  TRIP_UPDATED = "TRIP_UPDATED",
  TRIP_CANCELLED = "TRIP_CANCELLED",
  RESERVATION_CREATED = "RESERVATION_CREATED",
  RESERVATION_CANCELLED = "RESERVATION_CANCELLED",
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  EMPLOYEE_CREATED = "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED = "EMPLOYEE_UPDATED",
  EMPLOYEE_DELETED = "EMPLOYEE_DELETED",
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  RESERVATION = "RESERVATION",
  PAYMENT = "PAYMENT",
  TRIP = "TRIP",
  SYSTEM = "SYSTEM",
}

// Subscription Types
export interface Subscription {
  id: string;
  planName: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: string;
  paymentReference?: string;
  isActive: boolean;
  companyId: string;
  company?: Company;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionPlan {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Stats Types
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
  recentActivities: Activity[];
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  companyId?: string;
  routeId?: string;
  page?: number;
  limit?: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface CompanyForm {
  name: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  logo?: string;
}

export interface BusForm {
  plateNumber: string;
  model: string;
  brand: string;
  capacity: number;
  type: BusType;
  features?: string[];
  images?: string[];
}

export interface RouteForm {
  name: string;
  description?: string;
  departureLocation: string;
  arrivalLocation: string;
  departureCountry?: string;
  arrivalCountry?: string;
  distance: number;
  estimatedDuration: number;
  basePrice: number;
  isInternational: boolean;
  stops?: Omit<RouteStop, "id" | "routeId" | "route">[];
}

export interface TripForm {
  routeId: string;
  busId: string;
  departureDate: Date;
  departureTime: string;
  price: number;
  driverId?: string;
  conductorId?: string;
}

export interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  hireDate: Date;
  salary?: number;
  address?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
}

export interface ReservationForm {
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumbers: string[];
  tripId: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
