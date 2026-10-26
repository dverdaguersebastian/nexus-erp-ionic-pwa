/**
 * Modelos de Usuario y Autenticación
 * Define roles, credenciales y estructura del token JWT simulado
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  token?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  employeeCode: string;
}
