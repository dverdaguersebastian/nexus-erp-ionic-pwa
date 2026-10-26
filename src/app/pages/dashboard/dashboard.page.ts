import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonSpinner
} from '@ionic/angular';
import { forkJoin, Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { SqlApiService } from '../../core/services/sql-api.service';
import { NoSqlRealtimeService } from '../../core/services/nosql-realtime.service';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { StatWidgetComponent } from '../../shared/components/stat-widget/stat-widget.component';
import { SalesMonthlyMetric, DepartmentDistributionMetric, Employee } from '../../core/models/relational.model';
import { RealtimeTelemetry } from '../../core/models/nosql.model';

Chart.register(...registerables);

/**
 * Cuadro de Mando Ejecutivo (Dashboard) para Rol Administrador
 * Integra orquestación asíncrona dual (SQL + NoSQL con forkJoin),
 * visualizaciones analíticas con Chart.js y filtros interactivos en tiempo real.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonSpinner,
    StatWidgetComponent
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly sqlApi = inject(SqlApiService);
  private readonly noSqlService = inject(NoSqlRealtimeService);
  private readonly reportService = inject(ReportService);
  public readonly authService = inject(AuthService);

  @ViewChild('salesChartCanvas') salesChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('deptChartCanvas') deptChartCanvas!: ElementRef<HTMLCanvasElement>;

  public readonly isLoading = signal<boolean>(true);
  public readonly selectedFilterPeriod = signal<string>('ALL'); // ALL, LAST3, SEMESTER
  public readonly selectedDeptFilter = signal<string>('ALL');

  // Datos consolidados
  public readonly salesMetrics = signal<SalesMonthlyMetric[]>([]);
  public readonly deptDistribution = signal<DepartmentDistributionMetric[]>([]);
  public readonly employeesList = signal<Employee[]>([]);
  public readonly telemetry = signal<RealtimeTelemetry | null>(null);

  // Instancias de Chart.js
  private salesChart?: Chart;
  private deptChart?: Chart;
  private subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    this.loadConsolidatedData();
    this.listenToNoSqlTelemetry();
  }

  ngAfterViewInit(): void {
    // Los gráficos se instancian cuando el forkJoin finaliza y los canvas están listos
  }

  ngOnDestroy(): void {
    // Prevención de memory leaks destruyendo gráficos y cancelando suscripciones
    if (this.salesChart) this.salesChart.destroy();
    if (this.deptChart) this.deptChart.destroy();
    this.subscriptions.unsubscribe();
  }

  /**
   * Orquestación asíncrona avanzada con forkJoin (RA 5 - Consumo concurrente SQL)
   */
  loadConsolidatedData(): void {
    this.isLoading.set(true);

    const dualDataFetch$ = forkJoin({
      sales: this.sqlApi.getSalesMetrics(),
      departments: this.sqlApi.getDepartmentDistribution(),
      employees: this.sqlApi.getEmployees()
    });

    const sub = dualDataFetch$.subscribe({
      next: (result) => {
        this.salesMetrics.set(result.sales);
        this.deptDistribution.set(result.departments);
        this.employeesList.set(result.employees);
        this.isLoading.set(false);

        // Renderizado diferido de gráficos en el siguiente ciclo
        setTimeout(() => this.initCharts(), 50);
      },
      error: (err) => {
        console.error('Error al orquestar carga concurrente de datos:', err);
        this.isLoading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Consumo reactivo del flujo NoSQL en tiempo real (Telemetry & Audit)
   */
  private listenToNoSqlTelemetry(): void {
    const teleSub = this.noSqlService.telemetry$.subscribe((data) => {
      this.telemetry.set(data);
    });
    this.subscriptions.add(teleSub);
  }

  /**
   * Inicialización de Gráficos Visuales Chart.js
   */
  private initCharts(): void {
    if (!this.salesChartCanvas || !this.deptChartCanvas) return;

    this.buildSalesChart();
    this.buildDeptChart();
  }

  private buildSalesChart(): void {
    if (this.salesChart) this.salesChart.destroy();

    const metrics = this.getFilteredMetrics();
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: metrics.map(m => m.month),
        datasets: [
          {
            label: 'Facturación Real (€)',
            data: metrics.map(m => m.revenue),
            backgroundColor: '#1d4ed8',
            borderRadius: 6
          },
          {
            label: 'Gastos Operativos (€)',
            data: metrics.map(m => m.expenses),
            backgroundColor: '#94a3b8',
            borderRadius: 6
          },
          {
            type: 'line',
            label: 'Objetivo de Ventas (€)',
            data: metrics.map(m => m.target),
            borderColor: '#047857',
            borderWidth: 2,
            pointBackgroundColor: '#047857',
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.dataset.label}: €${Number(context.raw).toLocaleString('es-ES')}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val: any) => `€${Number(val) / 1000}k`
            }
          }
        }
      }
    });
  }

  private buildDeptChart(): void {
    if (this.deptChart) this.deptChart.destroy();

    const depts = this.deptDistribution();
    const ctx = this.deptChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.deptChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: depts.map(d => d.department),
        datasets: [
          {
            data: depts.map(d => d.budget),
            backgroundColor: ['#1d4ed8', '#0f766e', '#b45309', '#b91c1c', '#6366f1']
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` Presupuesto: €${Number(ctx.raw).toLocaleString('es-ES')}`
            }
          }
        }
      }
    });
  }

  /**
   * Filtrado dinámico en tiempo real para el gráfico
   */
  onPeriodFilterChange(event: any): void {
    const period = event.target?.value || 'ALL';
    this.selectedFilterPeriod.set(period);
    this.updateSalesChartData();
  }

  private getFilteredMetrics(): SalesMonthlyMetric[] {
    const all = this.salesMetrics();
    const filter = this.selectedFilterPeriod();
    if (filter === 'LAST3') {
      return all.slice(-3);
    }
    if (filter === 'SEMESTER') {
      return all.slice(-6);
    }
    return all;
  }

  private updateSalesChartData(): void {
    if (!this.salesChart) return;
    const metrics = this.getFilteredMetrics();
    this.salesChart.data.labels = metrics.map(m => m.month);
    this.salesChart.data.datasets[0].data = metrics.map(m => m.revenue);
    this.salesChart.data.datasets[1].data = metrics.map(m => m.expenses);
    this.salesChart.data.datasets[2].data = metrics.map(m => m.target);
    this.salesChart.update();
  }

  // Cálculos de KPIs para los StatWidgets
  get totalRevenueAccumulated(): string {
    const total = this.salesMetrics().reduce((sum, m) => sum + m.revenue, 0);
    return `€${(total / 1000).toFixed(0)}k`;
  }

  get totalEmployeesCount(): number {
    return this.employeesList().length;
  }

  get averageMargin(): string {
    const list = this.salesMetrics();
    if (list.length === 0) return '0%';
    const totalRev = list.reduce((s, m) => s + m.revenue, 0);
    const totalExp = list.reduce((s, m) => s + m.expenses, 0);
    const margin = Math.round(((totalRev - totalExp) / totalRev) * 100);
    return `${margin}%`;
  }

  exportCurrentPdf(): void {
    this.reportService.exportEmployeesPdf(this.employeesList(), {
      title: 'NexusERP Pro - Informe Cuadro de Mando Ejecutivo',
      filename: `NexusERP_Informe_Ejecutivo_${Date.now()}.pdf`
    });
  }

  exportCurrentCsv(): void {
    this.reportService.exportEmployeesCsv(this.employeesList(), 'NexusERP_Plantilla_Ejecutiva.csv');
  }
}
