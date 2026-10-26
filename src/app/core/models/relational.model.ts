/**
 * Modelos Relacionales (SQL REST API)
 * Entidades de negocio normalizadas con claves primarias y foráneas
 */

export interface Department {
  id: number;
  code: string;
  name: string;
  budget: number;
  headCount: number;
  managerName: string;
}

export type EmployeeStatus = 'ACTIVO' | 'EN_VACACIONES' | 'BAJA_TEMPORAL';

export interface Employee {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number;
  departmentName?: string;
  position: string;
  salary: number;
  status: EmployeeStatus;
  hireDate: string;
}

export type ClientStatus = 'ACTIVO' | 'POTENCIAL' | 'INACTIVO';

export interface Client {
  id: number;
  code: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  totalInvoiced: number;
  status: ClientStatus;
  createdAt: string;
}

export interface SalesMonthlyMetric {
  month: string;
  revenue: number;
  expenses: number;
  target: number;
  netMargin: number;
}

export interface DepartmentDistributionMetric {
  department: string;
  budget: number;
  salesShare: number;
}
