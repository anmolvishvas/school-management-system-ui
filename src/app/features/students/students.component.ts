import { Component, OnInit, signal } from '@angular/core';
import { StudentsService } from './students.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-students',
  standalone: true,
  templateUrl: './students.component.html'
})
export class StudentsComponent implements OnInit {

  students = signal<any[]>([]);

  constructor(
    private service: StudentsService,
    private router: Router
    ) {}

  ngOnInit() {
    this.service.getAll().subscribe({
      next: (res) => {
        console.log('API RESPONSE:', res);

        this.students.set(res);
      }
    });
    }
    
    logout() {
  localStorage.removeItem('token');
  this.router.navigate(['/']);
}
}