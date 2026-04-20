import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService) {}

  login() {
    this.error = '';

    this.auth.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        alert('Login successful');
      },
      error: () => {
        this.error = 'Invalid username or password';
      }
    });
  }
}