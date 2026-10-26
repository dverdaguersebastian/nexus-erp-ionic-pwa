import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonBadge
} from '@ionic/angular';
import { Subscription } from 'rxjs';

import { NoSqlRealtimeService } from '../../core/services/nosql-realtime.service';
import { AuthService } from '../../core/services/auth.service';
import { AuditLogDocument, RealtimeTelemetry } from '../../core/models/nosql.model';

/**
 * Página de Auditoría NoSQL en Tiempo Real
 * Muestra el flujo documental reactivo (Firestore Stream) con eventos en vivo,
 * latidos de telemetría y disparadores de eventos manuales.
 */
@Component({
  selector: 'app-realtime-audit',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonBadge
  ],
  templateUrl: './realtime-audit.page.html',
  styleUrls: ['./realtime-audit.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealtimeAuditPage implements OnInit, OnDestroy {
  private readonly noSqlService = inject(NoSqlRealtimeService);
  private readonly authService = inject(AuthService);

  public readonly auditLogs = signal<AuditLogDocument[]>([]);
  public readonly telemetry = signal<RealtimeTelemetry | null>(null);

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = new Subscription();

    const logsSub = this.noSqlService.auditLogs$.subscribe(logs => {
      this.auditLogs.set(logs);
    });
    this.subscription.add(logsSub);

    const teleSub = this.noSqlService.telemetry$.subscribe(tele => {
      this.telemetry.set(tele);
    });
    this.subscription.add(teleSub);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  triggerManualSecurityAlert(): void {
    const user = this.authService.currentUser();
    this.noSqlService.logCustomEvent(
      'UPDATE',
      'SECURITY',
      'Auditoría manual de seguridad ejecutada por el operador.',
      'WARNING',
      user?.id || 'USR-OP',
      user?.name || 'Operador',
      user?.role || 'admin'
    );
  }

  triggerSimulatedSaleEvent(): void {
    const user = this.authService.currentUser();
    this.noSqlService.logCustomEvent(
      'CREATE',
      'FINANCE',
      'Nueva orden comercial confirmada desde pasarela de pagos B2B (+€14,500).',
      'INFO',
      user?.id || 'USR-OP',
      user?.name || 'Operador',
      user?.role || 'admin'
    );
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'danger';
      case 'WARNING': return 'warning';
      default: return 'primary';
    }
  }
}
