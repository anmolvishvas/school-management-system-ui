import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentsService } from './students.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-students',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './students.component.html'
})
export class StudentsComponent implements OnInit {

    students = signal<any[]>([]);

    searchTerm = '';
    currentPage = signal(1);
    pageSize = 5;

    name = '';
    className = '';
    section = '';

    editingId: number | null = null;
    editName = '';
    editClass = '';
    editSection = '';

    sortBy = 'id';
    order = 'asc';
    total = signal(0);
    selectedClass = '';
    selectedSection = '';

    loading = signal(false);
    error = signal<string | null>(null);

    
    constructor(
        private service: StudentsService,
        private auth: AuthService,
        private toast: ToastService
    ) {}

    role = '';

    ngOnInit() {
    this.role = this.auth.getRole() || '';
    this.loadStudents();
    }

    loadStudents() {
        this.loading.set(true);
        this.error.set(null);

        this.service.getAll(
            this.currentPage(),
            this.pageSize,
            this.searchTerm,
            this.sortBy,
            this.order,
            this.selectedClass,
            this.selectedSection
        ).subscribe({
            next: (res) => {
            this.students.set(res.data);
            this.total.set(res.total);
            this.loading.set(false);
            },
            error: (err) => {
            console.error(err);
            this.error.set('Failed to load students');
            this.loading.set(false);
            }
        });
        }

    addStudent() {
    this.loading.set(true);
    this.error.set(null);

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
        this.toast.show('Student added successfully', 'success');
        },
        error: () => {
        this.toast.show('Failed to add student', 'error');
        this.loading.set(false);
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
        this.loading.set(true);
        this.error.set(null);

        const payload = {
            name: this.editName,
            class: this.editClass,
            section: this.editSection
        };

        this.service.update(id, payload).subscribe({
            next: () => {
            this.loadStudents();
            this.editingId = null;
            this.toast.show('Student updated successfully', 'success');
            },
            error: () => {
            this.toast.show('Update failed', 'error');
            this.loading.set(false);
            }
        });
    }

    deleteStudent(id: number) {
        if (!confirm('Delete this student?')) return;

        this.loading.set(true);
        this.error.set(null);

        this.service.delete(id).subscribe({
            next: () => {
                this.loadStudents();
                this.toast.show('Student deleted successfully', 'success');
            },
            error: () => {
            this.toast.show('Delete failed', 'error');
            this.loading.set(false);
            }
        });
    }

    isAddFormValid() {
        return this.name.trim() && this.className.trim() && this.section.trim();
    }

    isEditFormValid() {
        return this.editName.trim() && this.editClass.trim() && this.editSection.trim();
    }

    getFilteredStudents() {
        const term = this.searchTerm.toLowerCase();

        return this.students().filter(s =>
            s.name?.toLowerCase().includes(term) ||
            s.class?.toLowerCase().includes(term) ||
            s.section?.toLowerCase().includes(term)
        );
    }

    getPaginatedStudents() {
        const start = (this.currentPage() - 1) * this.pageSize;
        const end = start + this.pageSize;

        return this.getFilteredStudents().slice(start, end);
    }

    getTotalPages() {
        return Math.ceil(this.total() / this.pageSize);
    }

    nextPage() {
        if (this.currentPage() < this.getTotalPages()) {
            this.currentPage.set(this.currentPage() + 1);
            this.loadStudents();
        }
    }

    prevPage() {
        if (this.currentPage() > 1) {
            this.currentPage.set(this.currentPage() - 1);
            this.loadStudents();
        }
    }

    onSearchChange() {
        this.currentPage.set(1);
        this.loadStudents();
    }

    onFilterChange() {
    this.currentPage.set(1);
    this.loadStudents();
    }
}