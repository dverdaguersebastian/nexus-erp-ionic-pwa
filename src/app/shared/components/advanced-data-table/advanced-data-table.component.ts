import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonSearchbar, IonBadge } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'currency' | 'badge' | 'date';
  badgeColorMap?: Record<string, string>;
  formatter?: (val: any, row: T) => string;
}

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'danger' | 'warning' | 'medium';
  ariaLabel?: string;
}

/**
 * Componente Agnóstico de Tabla de Datos Avanzada
 * Implementa filtrado reactivo con debounce, ordenación bidireccional,
 * paginación, acciones personalizadas y accesibilidad total WAI-ARIA.
 */
@Component({
  selector: 'app-advanced-data-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonSearchbar,
    IonBadge
  ],
  templateUrl: './advanced-data-table.component.html',
  styleUrls: ['./advanced-data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvancedDataTableComponent<T extends Record<string, any>> implements OnInit, OnDestroy {
  // Entradas (Inputs)
  @Input({ required: true }) columns: TableColumn<T>[] = [];
  @Input({ required: true }) set data(value: T[]) {
    this._rawData.set(value || []);
    this.currentPage.set(1);
  }
  @Input() tableTitle = 'Listado de Registros';
  @Input() pageSize = 5;
  @Input() showSearch = true;
  @Input() showStatusFilter = true;
  @Input() statusFilterOptions: string[] = [];
  @Input() statusFilterKey = 'status';
  @Input() actions: TableAction[] = [];

  // Salidas (Outputs)
  @Output() readonly rowClick = new EventEmitter<T>();
  @Output() readonly actionClick = new EventEmitter<{ action: string; item: T }>();
  @Output() readonly filterChange = new EventEmitter<{ search: string; status: string }>();

  // Estado reactivo con Signals
  private readonly _rawData = signal<T[]>([]);
  public readonly searchQuery = signal<string>('');
  public readonly selectedStatus = signal<string>('ALL');
  public readonly sortColumn = signal<string | null>(null);
  public readonly sortDirection = signal<'asc' | 'desc'>('asc');
  public readonly currentPage = signal<number>(1);

  public readonly searchControl = new FormControl('');
  private searchSubscription?: Subscription;

  // Filtrado reactivo en memoria
  public readonly filteredData = computed(() => {
    let items = [...this._rawData()];
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    // Filtro de texto en cualquier columna
    if (query) {
      items = items.filter(item => {
        return Object.values(item).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // Filtro por estado
    if (status && status !== 'ALL' && this.statusFilterKey) {
      items = items.filter(item => item[this.statusFilterKey] === status);
    }

    // Ordenación
    const sortCol = this.sortColumn();
    if (sortCol) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        return valA > valB ? dir : -dir;
      });
    }

    return items;
  });

  // Paginación reactiva
  public readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredData().length / this.pageSize));
  });

  public readonly paginatedData = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredData().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    // Configuración de debounce reactivo en buscador para optimizar ciclos de renderizado
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged()
      )
      .subscribe(val => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
        this.emitFilterChange();
      });
  }

  ngOnDestroy(): void {
    // Prevención estricta de Memory Leaks
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSort(colKey: string, isSortable?: boolean): void {
    if (!isSortable) return;
    if (this.sortColumn() === colKey) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(colKey);
      this.sortDirection.set('asc');
    }
  }

  onStatusChange(event: any): void {
    const status = event.detail?.value || 'ALL';
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.emitFilterChange();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onRowSelect(item: T): void {
    this.rowClick.emit(item);
  }

  onActionTrigger(actionId: string, item: T, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action: actionId, item });
  }

  private emitFilterChange(): void {
    this.filterChange.emit({
      search: this.searchQuery(),
      status: this.selectedStatus()
    });
  }

  formatCellValue(col: TableColumn<T>, row: T): string {
    const val = row[col.key];
    if (col.formatter) {
      return col.formatter(val, row);
    }
    if (col.type === 'currency') {
      return `€${Number(val || 0).toLocaleString('es-ES')}`;
    }
    return val !== undefined && val !== null ? String(val) : '-';
  }

  getBadgeColor(col: TableColumn<T>, val: string): string {
    if (col.badgeColorMap && col.badgeColorMap[val]) {
      return col.badgeColorMap[val];
    }
    return 'medium';
  }
}
