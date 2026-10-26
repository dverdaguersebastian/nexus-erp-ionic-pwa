import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente Agnóstico de Widget de Métrica KPI
 * Representa visualmente un indicador cuantitativo con porcentaje de tendencia,
 * código de color accesible y emisión de eventos de interactividad.
 */
@Component({
  selector: 'app-stat-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-widget.component.html',
  styleUrls: ['./stat-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatWidgetComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) value: string | number = 0;
  @Input() subtitle = '';
  @Input() trendPercentage = 0;
  @Input() trendPeriod = 'vs mes anterior';
  @Input() iconSymbol = '📊';
  @Input() accentColor: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary';
  @Input() isClickable = false;

  @Output() readonly cardClick = new EventEmitter<void>();

  onTriggerClick(): void {
    if (this.isClickable) {
      this.cardClick.emit();
    }
  }

  get trendClass(): string {
    if (this.trendPercentage > 0) return 'trend-up';
    if (this.trendPercentage < 0) return 'trend-down';
    return 'trend-neutral';
  }

  get trendArrow(): string {
    if (this.trendPercentage > 0) return '▲ +';
    if (this.trendPercentage < 0) return '▼ ';
    return '= ';
  }
}
