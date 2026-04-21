import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="card">
      <mat-card-header>
        <mat-card-title>{{ title }}</mat-card-title>
        <mat-card-subtitle>Frontend module</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>
          This area is scaffolded for the next integration slice. When the matching API is available,
          this route will host the full workflow (forms, tables, and exports).
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        max-width: 720px;
        margin: 24px auto;
      }
      p {
        line-height: 1.5;
      }
    `
  ]
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['title'] as string) ?? 'Module';
}
