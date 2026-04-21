import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info') {
    const toast: Toast = { message, type };

    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.toasts.update(t => t.slice(1));
    }, 3000);
  }
}