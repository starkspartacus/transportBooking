export interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  year?: number;
  status: string;
  mileage?: number;
  lastMaintenance?: string | Date;
  nextMaintenance?: string | Date;
  insuranceExpiry?: string | Date;
  technicalControlExpiry?: string | Date;
  registrationExpiry?: string | Date;
  purchaseDate?: string | Date;
  purchasePrice?: number;
  companyId: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
