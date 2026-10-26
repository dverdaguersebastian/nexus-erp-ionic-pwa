import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, Client } from '../models/relational.model';

export interface ReportConfig {
  title: string;
  subtitle: string;
  author: string;
  filename: string;
}

/**
 * Servicio de Generación y Exportación de Informes
 * Produce descargas tabuladas en formatos estándar PDF y CSV
 * con diseño corporativo y cumplimiento de especificaciones técnicas.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {

  /**
   * Genera y descarga un informe profesional en formato PDF
   */
  exportEmployeesPdf(employees: Employee[], config?: Partial<ReportConfig>): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const title = config?.title || 'NexusERP Pro - Informe Oficial de Plantilla de Empleados';
    const author = config?.author || 'Diego Verdaguer Sebastián';
    const now = new Date().toLocaleString('es-ES');

    // Cabecera Corporativa
    doc.setFillColor(29, 78, 216); // Azul Corporativo #1d4ed8
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 15);

    // Metadatos
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado por: ${author} | Fecha: ${now} | Entorno: Producción PWA`, 14, 32);

    // Resumen Ejecutivo
    const totalSalary = employees.reduce((acc, e) => acc + e.salary, 0);
    const avgSalary = Math.round(totalSalary / (employees.length || 1));
    const activeCount = employees.filter(e => e.status === 'ACTIVO').length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 36, 269, 14, 2, 2, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Métricas Clave: Empleados Totales: ${employees.length}  |  Activos: ${activeCount}  |  Masa Salarial Anual: €${totalSalary.toLocaleString('es-ES')}  |  Salario Medio: €${avgSalary.toLocaleString('es-ES')}`,
      18,
      45
    );

    // Tabla tabulada con autoTable
    const tableData = employees.map(emp => [
      emp.code,
      `${emp.firstName} ${emp.lastName}`,
      emp.email,
      emp.departmentName || 'N/A',
      emp.position,
      `€${emp.salary.toLocaleString('es-ES')}`,
      emp.status,
      emp.hireDate
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Código', 'Nombre Completo', 'Correo Electrónico', 'Departamento', 'Puesto', 'Salario Anual', 'Estado', 'Fecha Alta']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [29, 78, 216],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    const filename = config?.filename || `Informe_Empleados_NexusERP_${Date.now()}.pdf`;
    doc.save(filename);
  }

  /**
   * Genera y descarga un informe tabulado en formato CSV estandarizado
   */
  exportEmployeesCsv(employees: Employee[], filename = 'nexus_empleados_export.csv'): void {
    const headers = ['Código', 'Nombre', 'Apellidos', 'Correo', 'Departamento', 'Puesto', 'Salario', 'Estado', 'FechaAlta'];
    const rows = employees.map(emp => [
      emp.code,
      `"${emp.firstName}"`,
      `"${emp.lastName}"`,
      emp.email,
      `"${emp.departmentName || ''}"`,
      `"${emp.position}"`,
      emp.salary,
      emp.status,
      emp.hireDate
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    this.triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporta cartera de clientes a CSV
   */
  exportClientsCsv(clients: Client[], filename = 'nexus_clientes_crm_export.csv'): void {
    const headers = ['Código', 'Empresa', 'Contacto', 'Email', 'Teléfono', 'Ciudad', 'FacturaciónTotal', 'Estado', 'FechaAlta'];
    const rows = clients.map(c => [
      c.code,
      `"${c.companyName}"`,
      `"${c.contactPerson}"`,
      c.email,
      `"${c.phone}"`,
      `"${c.city}"`,
      c.totalInvoiced,
      c.status,
      c.createdAt
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    this.triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
  }

  private triggerDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
