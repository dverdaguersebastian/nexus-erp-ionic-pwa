/**
 * Modelos NoSQL Documental y Tiempo Real (Firestore / Document-Store)
 * Estructura semiestructurada de eventos y auditoría en tiempo real
 */

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLogDocument {
  id: string;
  collection: 'audit_logs';
  timestamp: string;
  actor: {
    userId: string;
    userName: string;
    role: 'admin' | 'user';
    ipAddress?: string;
  };
  event: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT_REPORT' | 'ACCESS_DENIED';
    entity: 'EMPLOYEE' | 'CLIENT' | 'FINANCE' | 'SECURITY';
    entityId?: string | number;
    description: string;
    severity: AuditSeverity;
  };
  metadata?: Record<string, unknown>;
}

export interface RealtimeTelemetry {
  activeUsersCount: number;
  transactionsPerSecond: number;
  serverLoadPercentage: number;
  databaseStatus: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE';
  lastSynchronizedAt: string;
}
