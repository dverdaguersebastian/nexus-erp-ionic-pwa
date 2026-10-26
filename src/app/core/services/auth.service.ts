import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { User, AuthSession, LoginCredentials, RegisterDto, UserRole } from '../models/user.model';

const STORAGE_SESSION_KEY = 'nexus_auth_session';

/**
 * Servicio de Autenticación Reactivo con Signals y RxJS
 * Implementa gestión predecible del estado de identidad, emisión de tokens JWT
 * y validaciones asíncronas para el alta de usuarios.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado reactivo con Signals de Angular
  private readonly _currentSession = signal<AuthSession | null>(this.loadPersistedSession());

  public readonly currentUser = computed<User | null>(() => this._currentSession()?.user ?? null);
  public readonly isAuthenticated = computed<boolean>(() => !!this._currentSession() && Date.now() < (this._currentSession()?.expiresAt ?? 0));
  public readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? null);
  public readonly isAdmin = computed<boolean>(() => this.userRole() === 'admin');

  // Base de datos de prueba preconfigurada
  private readonly defaultUsers: Array<User & { passwordHash: string }> = [
    {
      id: 'USR-001',
      name: 'Daniel Verdaguer Sebastián',
      email: 'admin@empresa.com',
      role: 'admin',
      department: 'Dirección General & IT',
      passwordHash: 'admin123'
    },
    {
      id: 'USR-002',
      name: 'Elena Martínez López',
      email: 'empleado@empresa.com',
      role: 'user',
      department: 'Ventas y Operaciones',
      passwordHash: 'user123'
    }
  ];

  constructor() {
    this.verifyAndAutoRefreshSession();
  }

  /**
   * Carga sesión previa persistida en localStorage si el token es válido
   */
  private loadPersistedSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!data) return null;
      const session: AuthSession = JSON.parse(data);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Autenticación asíncrona mediante credenciales
   */
  login(credentials: LoginCredentials): Observable<User> {
    return of(null).pipe(
      delay(600), // Simulación de latencia de red
      map(() => {
        const found = this.defaultUsers.find(
          u => u.email.toLowerCase() === credentials.email.trim().toLowerCase() && u.passwordHash === credentials.password
        );

        if (!found) {
          throw new Error('Credenciales inválidas. Compruebe su correo y contraseña.');
        }

        const token = this.generateSimulatedJwt(found);
        const session: AuthSession = {
          user: {
            id: found.id,
            name: found.name,
            email: found.email,
            role: found.role,
            department: found.department,
            token
          },
          token,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 Horas
        };

        this.persistSession(session);
        return session.user;
      })
    );
  }

  /**
   * Registro asíncrono de un nuevo usuario en el sistema
   */
  register(dto: RegisterDto): Observable<User> {
    return of(null).pipe(
      delay(750),
      map(() => {
        const exists = this.defaultUsers.some(u => u.email.toLowerCase() === dto.email.trim().toLowerCase());
        if (exists) {
          throw new Error('El correo electrónico ya se encuentra registrado en el sistema.');
        }

        const newUser: User & { passwordHash: string } = {
          id: `USR-${(this.defaultUsers.length + 1).toString().padStart(3, '0')}`,
          name: dto.name,
          email: dto.email.trim().toLowerCase(),
          role: dto.role,
          department: dto.department,
          passwordHash: dto.password
        };

        this.defaultUsers.push(newUser);
        const token = this.generateSimulatedJwt(newUser);
        const session: AuthSession = {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            department: newUser.department,
            token
          },
          token,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000
        };

        this.persistSession(session);
        return session.user;
      })
    );
  }

  /**
   * Validación asíncrona de disponibilidad de correo electrónico (para Reactive Forms)
   */
  checkEmailAvailability(email: string): Observable<boolean> {
    if (!email || !email.includes('@')) {
      return of(true);
    }
    return of(null).pipe(
      delay(450),
      map(() => {
        const emailLower = email.trim().toLowerCase();
        const exists = this.defaultUsers.some(u => u.email.toLowerCase() === emailLower);
        return !exists; // true = disponible, false = ya ocupado
      })
    );
  }

  /**
   * Validación asíncrona de disponibilidad de código de empleado
   */
  checkEmployeeCodeAvailability(code: string): Observable<boolean> {
    if (!code || code.trim().length < 3) return of(true);
    return of(null).pipe(
      delay(400),
      map(() => {
        const codeUpper = code.trim().toUpperCase();
        // Códigos ya registrados
        const reservedCodes = ['EMP-001', 'EMP-002', 'EMP-003', 'DIR-001'];
        return !reservedCodes.includes(codeUpper);
      })
    );
  }

  /**
   * Cierre de sesión y limpieza de tokens
   */
  logout(): void {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    this._currentSession.set(null);
  }

  /**
   * Obtiene el token JWT actual para inyección en el interceptor
   */
  getRawToken(): string | null {
    const session = this._currentSession();
    if (!session || Date.now() > session.expiresAt) return null;
    return session.token;
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    this._currentSession.set(session);
  }

  private generateSimulatedJwt(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 8 * 3600000) / 1000)
    }));
    const signature = btoa(`sig_${user.id}_${Date.now()}`);
    return `${header}.${payload}.${signature}`;
  }

  private verifyAndAutoRefreshSession(): void {
    const session = this._currentSession();
    if (session && Date.now() > session.expiresAt) {
      this.logout();
    }
  }
}
