import { Injectable, signal } from '@angular/core';

export type FontScale = 'normal' | 'large' | 'extra-large';

/**
 * Servicio de Accesibilidad e Inclusión (WCAG 2.1 AA/AAA)
 * Gestiona de forma reactiva el modo de alto contraste, escala de fuente
 * y anuncios sonoros accesibles para tecnologías de asistencia (WAI-ARIA Live Regions).
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  public readonly isHighContrast = signal<boolean>(false);
  public readonly currentFontScale = signal<FontScale>('normal');
  public readonly liveAnnouncement = signal<string>('');

  constructor() {
    // Detectar preferencia del sistema operativo del usuario
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersContrast = window.matchMedia('(prefers-contrast: more)');
      if (prefersContrast.matches) {
        this.toggleHighContrast(true);
      }
    }
  }

  /**
   * Conmuta el modo de alto contraste reglamentario (WCAG AAA)
   */
  toggleHighContrast(forcedValue?: boolean): void {
    const nextVal = forcedValue !== undefined ? forcedValue : !this.isHighContrast();
    this.isHighContrast.set(nextVal);

    if (typeof document !== 'undefined') {
      if (nextVal) {
        document.body.classList.add('high-contrast');
        this.announce('Modo de alto contraste activado.');
      } else {
        document.body.classList.remove('high-contrast');
        this.announce('Modo de alto contraste desactivado.');
      }
    }
  }

  /**
   * Cambia el escalado tipográfico relativo
   */
  setFontScale(scale: FontScale): void {
    this.currentFontScale.set(scale);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (scale === 'normal') root.style.fontSize = '16px';
      else if (scale === 'large') root.style.fontSize = '18px';
      else if (scale === 'extra-large') root.style.fontSize = '20px';

      this.announce(`Tamaño de tipografía cambiado a ${scale}.`);
    }
  }

  /**
   * Emite un anuncio audible para lectores de pantalla vía aria-live="polite"
   */
  announce(message: string): void {
    this.liveAnnouncement.set(message);
    setTimeout(() => {
      if (this.liveAnnouncement() === message) {
        this.liveAnnouncement.set('');
      }
    }, 4000);
  }
}
