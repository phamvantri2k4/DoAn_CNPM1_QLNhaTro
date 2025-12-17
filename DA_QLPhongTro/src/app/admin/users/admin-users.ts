import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { AdminUserService } from '../../services/admin-user.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsersComponent {
  users: User[] = [];
  loading = false;
  message = '';

  editingUserId: number | null = null;
  editForm: Partial<User> = {};

  constructor(private adminUserService: AdminUserService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.adminUserService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tải được người dùng';
      }
    });
  }

  toggle(user: User): void {
    const id = user.id ?? user.userId;
    this.adminUserService.toggleStatus(Number(id)).subscribe({
      next: () => this.fetch(),
      error: () => (this.message = 'Cập nhật trạng thái thất bại')
    });
  }

  startEdit(user: User): void {
    const id = user.id ?? user.userId;
    this.editingUserId = Number(id);
    this.message = '';
    this.editForm = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role || user.account?.role
    };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editForm = {};
  }

  saveEdit(): void {
    if (!this.editingUserId) return;
    const id = this.editingUserId;

    const payload: Partial<User> = {
      fullName: this.editForm.fullName || '',
      email: this.editForm.email || '',
      phone: this.editForm.phone,
      address: this.editForm.address,
      role: this.editForm.role
    };

    this.adminUserService.update(id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.fetch();
      },
      error: () => {
        this.message = 'Cập nhật người dùng thất bại';
      }
    });
  }
}

