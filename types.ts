export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Weaver {
  id: string;
  name: string;
  phone?: string;
  createdAt: number;
}

export interface Warper {
  id: string;
  name: string;
  phone?: string;
  createdAt: number;
}

export interface YarnDispatch {
  id: string;
  date: string;
  recipientType: 'warper' | 'weaver';
  recipientId: string;
  yarnCategory: 'warp' | 'weft' | 'zari' | 'other';
  yarnType: string;
  color: string;
  weightKg: number;
  supplierId?: string;
  supplierName?: string;
  billNumber?: string;
  denier?: string;
  createdAt: number;
}

export interface WarperReturn {
  id: string;
  warperId: string;
  date: string;
  warpNumber?: string;
  length?: number;
  weight?: number;
  weightKg?: number;
  denier?: string;
  color?: string;
  weaverId?: string;
  weaverName?: string;
  yarnType?: string;
  ends?: number;
  orderId?: string;
  createdAt: number;
}

export interface DenierFormula {
  id: string;
  denier: string;
  multiplier: number; // Legacy: kg per end
  gramsPerEnd?: number; // New: grams per end
}

export interface WarpSection {
  id: string;
  name?: string;
  color?: string;
  ends: number;
  length: number;
  weight?: number;
  denier?: string;
}

export interface Loom {
  id: string;
  number?: string;
  loomNumber?: string;
  designName?: string;
  weaverId: string;
  status?: 'idle' | 'running' | 'maintenance';
  createdAt: number;
}

export interface WarpOrder {
  id: string;
  warperId: string;
  date: string;
  orderNumber?: string;
  designName?: string;
  totalEnds: number;
  totalLength: number;
  sections: WarpSection[];
  status: 'pending' | 'in-progress' | 'completed';
  assignedWeaverId?: string;
  assignedLoomId?: string;
  weaverId?: string;
  weaverName?: string;
  loomId?: string;
  loomNumber?: string;
  totalYarnWeight?: number;
  totalWeight?: number;
  warpYarnType?: string;
  weftYarnType?: string;
  totalSareesExpected?: number;
  warpLengthMeters?: number;
  wage?: number;
  wagePaid?: number;
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  createdAt: number;
}

export interface LoomTransaction {
  id: string;
  loomId: string;
  date: string;
  type: 'warp_loaded' | 'saree_produced' | 'maintenance' | 'other';
  description?: string;
  warpOrderId?: string;
  sareeCount?: number;
  yarnGivenWeight?: number;
  yarnType?: string;
  createdAt: number;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  mobile?: string;
  address?: string;
  isLoggedIn: boolean;
  includePhotosInBackup?: boolean;
  backupEmail?: string;
  lastBackupDate?: number;
  backupFrequency?: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  gstin?: string;
  email?: string;
}
