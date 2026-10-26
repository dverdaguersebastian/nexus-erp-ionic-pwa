import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { AuditLogDocument, RealtimeTelemetry, AuditSeverity } from '../models/nosql.model';

/**
 * Servicio en Tiempo Real Documental NoSQL (Simulación Firebase Firestore / Cloud Firestore)
 * Gestiona un flujo reactivo (Observable Stream) mediante BehaviorSubject que emite
 * instantáneamente actualizaciones documentales de auditoría y telemetría sin refrescar página.
 */
@Injectable({
  providedIn: 'root'
})
export class NoSqlRealtimeService implements OnDestroy {
  private readonly defaultLogs: AuditLogDocument[] = [
    {
      id: 'doc_log_101',
      collection: 'audit_logs',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      actor: { userId: 'USR-001', userName: 'Diego Verdaguer', role: 'admin', ipAddress: '192.168.1.45' },
      event: { action: 'LOGIN', entity: 'SECURITY', description: 'Inicio de sesión con credenciales de Administrador y generación de token JWT.', severity: 'INFO' }
    },
    {
      id: 'doc_log_102',
      collection: 'audit_logs',
      timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
      actor: { userId: 'USR-001', userName: 'Diego Verdaguer', role: 'admin', ipAddress: '192.168.1.45' },
      event: { action: 'UPDATE', entity: 'FINANCE', entityId: 'DEP-ENG', description: 'Ajuste presupuestario aprobado para el departamento de Ingeniería de Software (+12%).', severity: 'INFO' }
    },
    {
      id: 'doc_log_103',
      collection: 'audit_logs',
      timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
      actor: { userId: 'USR-002', userName: 'Elena Martínez', role: 'user', ipAddress: '192.168.1.72' },
      event: { action: 'EXPORT_REPORT', entity: 'EMPLOYEE', description: 'Descarga de informe tabulado de nóminas en formato CSV.', severity: 'INFO' }
    },
    {
      id: 'doc_log_104',
      collection: 'audit_logs',
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      actor: { userId: 'USR-ANON', userName: 'Sistema Firewall', role: 'user', ipAddress: '84.120.45.19' },
      event: { action: 'ACCESS_DENIED', entity: 'SECURITY', description: 'Intento de acceso denegado a endpoint /admin/metrics sin token válido.', severity: 'WARNING' }
    }
  ];

  private readonly logsSubject = new BehaviorSubject<AuditLogDocument[]>(this.defaultLogs);
  public readonly auditLogs$: Observable<AuditLogDocument[]> = this.logsSubject.asObservable();

  private readonly telemetrySubject = new BehaviorSubject<RealtimeTelemetry>({
    activeUsersCount: 18,
    transactionsPerSecond: 24.6,
    serverLoadPercentage: 32.4,
    databaseStatus: 'HEALTHY',
    lastSynchronizedAt: new Date().toISOString()
  });
  public readonly telemetry$: Observable<RealtimeTelemetry> = this.telemetrySubject.asObservable();

  private backgroundSubscription?: Subscription;

  constructor() {
    this.startRealtimeSimulation();
  }

  /**
   * Inicia el latido en tiempo real simulando llegada de eventos periódicos cada 25 segundos
   */
  private startRealtimeSimulation(): void {
    const mockEvents: Array<Omit<AuditLogDocument['event'], 'severity'> & { severity: AuditSeverity }> = [
      { action: 'UPDATE', entity: 'CLIENT', description: 'Sincronización de nuevo pedido desde pasarela B2B.', severity: 'INFO' },
      { action: 'LOGIN', entity: 'SECURITY', description: 'Renovación de token JWT para sesión de usuario estándar.', severity: 'INFO' },
      { action: 'UPDATE', entity: 'FINANCE', description: 'Actualización de balances contables automatizada.', severity: 'INFO' }
    ];

    let eventIdx = 0;
    this.backgroundSubscription = interval(25000).subscribe(() => {
      const sample = mockEvents[eventIdx % mockEvents.length];
      eventIdx++;

      this.logCustomEvent(
        sample.action,
        sample.entity,
        sample.description,
        sample.severity,
        'SYSTEM_DAEMON',
        'Demonio Sincronización NoSQL',
        'admin'
      );

      // Actualizar telemetría
      this.telemetrySubject.next({
        activeUsersCount: Math.floor(15 + Math.random() * 10),
        transactionsPerSecond: parseFloat((20 + Math.random() * 15).toFixed(1)),
        serverLoadPercentage: parseFloat((25 + Math.random() * 20).toFixed(1)),
        databaseStatus: 'HEALTHY',
        lastSynchronizedAt: new Date().toISOString()
      });
    });
  }

  /**
   * Inserta un nuevo documento en la colección en tiempo real
   */
  logCustomEvent(
    action: AuditLogDocument['event']['action'],
    entity: AuditLogDocument['event']['entity'],
    description: string,
    severity: AuditSeverity = 'INFO',
    userId = 'USR-ACTIVE',
    userName = 'Usuario Actual',
    role: 'admin' | 'user' = 'user'
  ): void {
    const newDoc: AuditLogDocument = {
      id: `doc_log_${Date.now()}`,
      collection: 'audit_logs',
      timestamp: new Date().toISOString(),
      actor: {
        userId,
        userName,
        role
      },
      event: {
        action,
        entity,
        description,
        severity
      }
    };

    const current = this.logsSubject.getValue();
    this.logsSubject.next([newDoc, ...current]);
  }

  ngOnDestroy(): void {
    if (this.backgroundSubscription) {
      this.backgroundSubscription.unsubscribe();
    }
  }
}
