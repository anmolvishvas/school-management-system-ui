import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentsService } from './students.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './students.component.html'
})
export class StudentsComponent implements OnInit {

  students = signal<any[]>([]);

  name = '';
  className = '';
  section = '';

    editingId: number | null = null;
  editName = '';
  editClass = '';
  editSection = '';

  constructor(private service: StudentsService) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.service.getAll().subscribe({
      next: (res) => this.students.set(res)
    });
  }

  addStudent() {
    const payload = {
      name: this.name,
      class: this.className,
      section: this.section
    };

    this.service.add(payload).subscribe({
      next: () => {
        this.name = '';
        this.className = '';
        this.section = '';
        this.loadStudents();
      }
    });
  }

  startEdit(s: any) {
    this.editingId = s.id;
    this.editName = s.name;
    this.editClass = s.class;
    this.editSection = s.section;
  }

  cancelEdit() {
    this.editingId = null;
  }

  saveEdit(id: number) {
    const payload = {
      name: this.editName,
      class: this.editClass,
      section: this.editSection
    };

    this.service.update(id, payload).subscribe({
      next: () => {
        this.students.update(list =>
          list.map(s =>
            s.id === id ? { ...s, ...payload } : s
          )
        );

        this.editingId = null;
      },
      error: (err) => {
        console.error(err);
        alert('Update failed');
      }
    });
  }

  deleteStudent(id: number) {
    if (!confirm('Delete this student?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.students.update(list => list.filter(s => s.id !== id));
      }
    });
  }
}