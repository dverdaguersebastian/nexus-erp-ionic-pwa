import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton
} from '@ionic/angular';
import { HelpGuideComponent } from '../../shared/components/help-guide/help-guide.component';

/**
 * Página de Ayuda y Manual de Usuario Integrado
 * Embebe la guía interactiva y documentación del sistema (RA 6).
 */
@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    HelpGuideComponent
  ],
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpPage {}
