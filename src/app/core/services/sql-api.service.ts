import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Department, Employee, Client, SalesMonthlyMetric, DepartmentDistributionMetric } from '../models/relational.model';

/**
 * Servicio de Consumo de Datos Relacionales (SQL REST API)
 * Simula el acceso asíncrono a una base de datos relacional normalizada
 * con claves primarias, claves foráneas, operaciones CRUD y agregaciones de negocio.
 */
@Injectable({
  providedIn: 'root'
})
export class SqlApiService {
  // Tablas relacionales en memoria
  private departments: Department[] = [
    { id: 1, code: 'DEP-DIR', name: 'Dirección General & Estrategia', budget: 450000, headCount: 4, managerName: 'Diego Verdaguer' },
    { id: 2, code: 'DEP-ENG', name: 'Ingeniería de Software & Cloud', budget: 780000, headCount: 12, managerName: 'Elena Martínez' },
    { id: 3, code: 'DEP-FIN', name: 'Finanzas, Tesorería & Auditoría', budget: 320000, headCount: 5, managerName: 'Carlos Santillana' },
    { id: 4, code: 'DEP-MKT', name: 'Marketing & Adquisición B2B', budget: 280000, headCount: 6, managerName: 'Lucía Benítez' },
    { id: 5, code: 'DEP-HR', name: 'Recursos Humanos & Cultura', budget: 190000, headCount: 3, managerName: 'Alejandro Morales' }
  ];

  private employees: Employee[] = [
    { id: 101, code: 'EMP-001', firstName: 'Diego', lastName: 'Verdaguer Sebastián', email: 'admin@empresa.com', departmentId: 1, departmentName: 'Dirección General & Estrategia', position: 'Chief Technology Officer', salary: 75000, status: 'ACTIVO', hireDate: '2023-01-15' },
    { id: 102, code: 'EMP-002', firstName: 'Elena', lastName: 'Martínez López', email: 'empleado@empresa.com', departmentId: 2, departmentName: 'Ingeniería de Software & Cloud', position: 'Lead Software Architect', salary: 58000, status: 'ACTIVO', hireDate: '2023-03-20' },
    { id: 103, code: 'EMP-003', firstName: 'Carlos', lastName: 'Santillana Mora', email: 'carlos.santillana@empresa.com', departmentId: 3, departmentName: 'Finanzas, Tesorería & Auditoría', position: 'Senior Financial Analyst', salary: 46000, status: 'ACTIVO', hireDate: '2023-06-10' },
    { id: 104, code: 'EMP-004', firstName: 'Lucía', lastName: 'Benítez Ortega', email: 'lucia.benitez@empresa.com', departmentId: 4, departmentName: 'Marketing & Adquisición B2B', position: 'Growth Marketing Director', salary: 49000, status: 'EN_VACACIONES', hireDate: '2023-09-01' },
    { id: 105, code: 'EMP-005', firstName: 'Alejandro', lastName: 'Morales Gil', email: 'alejandro.morales@empresa.com', departmentId: 5, departmentName: 'Recursos Humanos & Cultura', position: 'People & Talent Lead', salary: 42000, status: 'ACTIVO', hireDate: '2024-02-12' },
    { id: 106, code: 'EMP-006', firstName: 'Sofía', lastName: 'Ramos Delgado', email: 'sofia.ramos@empresa.com', departmentId: 2, departmentName: 'Ingeniería de Software & Cloud', position: 'Fullstack Angular Engineer', salary: 44000, status: 'ACTIVO', hireDate: '2024-04-18' },
    { id: 107, code: 'EMP-007', firstName: 'Javier', lastName: 'Pardo Serrano', email: 'javier.pardo@empresa.com', departmentId: 2, departmentName: 'Ingeniería de Software & Cloud', position: 'DevOps & SRE Specialist', salary: 47000, status: 'ACTIVO', hireDate: '2024-05-01' },
    { id: 108, code: 'EMP-008', firstName: 'Marta', lastName: 'Vázquez Cruz', email: 'marta.vazquez@empresa.com', departmentId: 4, departmentName: 'Marketing & Adquisición B2B', position: 'Brand & Content Strategist', salary: 38000, status: 'BAJA_TEMPORAL', hireDate: '2024-07-22' }
  ];

  private clients: Client[] = [
    { id: 201, code: 'CLI-001', companyName: 'Iberia Logistics Global S.L.', contactPerson: 'Marcos Alonso', email: 'malonso@iberialog.es', phone: '+34 912 345 678', city: 'Madrid', totalInvoiced: 142500, status: 'ACTIVO', createdAt: '2023-02-14' },
    { id: 202, code: 'CLI-002', companyName: 'BioHealth Pharma Group', contactPerson: 'Clara Domínguez', email: 'cdominguez@biohealth.eu', phone: '+34 934 887 112', city: 'Barcelona', totalInvoiced: 289000, status: 'ACTIVO', createdAt: '2023-05-19' },
    { id: 203, code: 'CLI-003', companyName: 'Valencia AgroTech Innovations', contactPerson: 'Vicente Navarro', email: 'vnavarro@agrotech.es', phone: '+34 963 120 445', city: 'Valencia', totalInvoiced: 87300, status: 'ACTIVO', createdAt: '2023-08-30' },
    { id: 204, code: 'CLI-004', companyName: 'Sevilla Green Energy Corp', contactPerson: 'Rocío Marín', email: 'rmarin@greenenergy.es', phone: '+34 954 661 229', city: 'Sevilla', totalInvoiced: 194000, status: 'POTENCIAL', createdAt: '2024-01-11' },
    { id: 205, code: 'CLI-005', companyName: 'Bilbao FinTech Ventures', contactPerson: 'Iñigo Etxebarria', email: 'ietxebarria@bilbaofintech.com', phone: '+34 944 550 780', city: 'Bilbao', totalInvoiced: 310400, status: 'ACTIVO', createdAt: '2024-03-05' },
    { id: 206, code: 'CLI-006', companyName: 'Málaga Smart City Hub', contactPerson: 'Beatriz Toledo', email: 'btoledo@smarthub.es', phone: '+34 951 773 901', city: 'Málaga', totalInvoiced: 56000, status: 'INACTIVO', createdAt: '2024-06-20' }
  ];

  private monthlySales: SalesMonthlyMetric[] = [
    { month: 'Mayo 2026', revenue: 142000, expenses: 92000, target: 135000, netMargin: 50000 },
    { month: 'Junio 2026', revenue: 168000, expenses: 98000, target: 150000, netMargin: 70000 },
    { month: 'Julio 2026', revenue: 155000, expenses: 94000, target: 155000, netMargin: 61000 },
    { month: 'Agosto 2026', revenue: 139000, expenses: 89000, target: 140000, netMargin: 50000 },
    { month: 'Septiembre 2026', revenue: 185000, expenses: 104000, target: 170000, netMargin: 81000 },
    { month: 'Octubre 2026', revenue: 215000, expenses: 112000, target: 190000, netMargin: 103000 }
  ];

  /**
   * Obtiene la relación de empleados con JOIN del nombre de departamento
   */
  getEmployees(): Observable<Employee[]> {
    return of([...this.employees]).pipe(
      delay(400),
      map(emps => emps.map(emp => {
        const dept = this.departments.find(d => d.id === emp.departmentId);
        return { ...emp, departmentName: dept ? dept.name : 'Sin Asignar' };
      }))
    );
  }

  /**
   * Obtiene la tabla de departamentos de la organización
   */
  getDepartments(): Observable<Department[]> {
    return of([...this.departments]).pipe(delay(300));
  }

  /**
   * Obtiene la cartera de clientes de la base de datos relacional
   */
  getClients(): Observable<Client[]> {
    return of([...this.clients]).pipe(delay(350));
  }

  /**
   * Obtiene métricas mensuales consolidadas de facturación
   */
  getSalesMetrics(): Observable<SalesMonthlyMetric[]> {
    return of([...this.monthlySales]).pipe(delay(450));
  }

  /**
   * Obtiene la distribución porcentual de presupuesto por departamento
   */
  getDepartmentDistribution(): Observable<DepartmentDistributionMetric[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const totalBudget = this.departments.reduce((sum, d) => sum + d.budget, 0);
        return this.departments.map(d => ({
          department: d.name.split('&')[0].trim(),
          budget: d.budget,
          salesShare: Math.round((d.budget / totalBudget) * 100)
        }));
      })
    );
  }

  /**
   * Operación de Inserción (INSERT INTO employees)
   */
  addEmployee(newEmp: Omit<Employee, 'id'>): Observable<Employee> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const maxId = this.employees.reduce((max, e) => Math.max(max, e.id), 100);
        const dept = this.departments.find(d => d.id === Number(newEmp.departmentId));
        const created: Employee = {
          ...newEmp,
          id: maxId + 1,
          departmentName: dept ? dept.name : 'General'
        };
        this.employees.unshift(created);
        return created;
      })
    );
  }

  /**
   * Operación de Actualización (UPDATE employees SET ...)
   */
  updateEmployee(updated: Employee): Observable<Employee> {
    return of(null).pipe(
      delay(450),
      map(() => {
        const index = this.employees.findIndex(e => e.id === updated.id);
        if (index === -1) throw new Error('Empleado no encontrado en el sistema.');
        const dept = this.departments.find(d => d.id === Number(updated.departmentId));
        this.employees[index] = {
          ...updated,
          departmentName: dept ? dept.name : this.employees[index].departmentName
        };
        return this.employees[index];
      })
    );
  }

  /**
   * Operación de Borrado (DELETE FROM employees WHERE id = ?)
   */
  deleteEmployee(id: number): Observable<boolean> {
    return of(null).pipe(
      delay(400),
      map(() => {
        const initialLen = this.employees.length;
        this.employees = this.employees.filter(e => e.id !== id);
        return this.employees.length < initialLen;
      })
    );
  }

  /**
   * Inserción de un nuevo cliente CRM
   */
  addClient(newClient: Omit<Client, 'id' | 'createdAt'>): Observable<Client> {
    return of(null).pipe(
      delay(450),
      map(() => {
        const maxId = this.clients.reduce((max, c) => Math.max(max, c.id), 200);
        const created: Client = {
          ...newClient,
          id: maxId + 1,
          createdAt: new Date().toISOString().split('T')[0]
        };
        this.clients.unshift(created);
        return created;
      })
    );
  }
}
