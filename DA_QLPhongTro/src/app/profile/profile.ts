import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http-service';
import { User } from '../models/user.model';
import { DialogService } from '../components/dialog/dialog.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  form: Partial<User> = {};
  message = '';
  uploadingAvatar = false;
  
  // For password change
  passwordForm = { oldPassword: '', newPassword: '' };
  passwordMessage = '';
  isPasswordError = false;
  isError = false;
  isSaving = false;
  isChangingPassword = false;

  get avatarUrl(): string {
    return this.getAvatarSrc();
  }

  constructor(private auth: AuthService, private api: HttpService, private dialog: DialogService) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.message = 'Bạn cần đăng nhập';
      this.isError = true;
      return;
    }
    this.api.getMyProfile().subscribe({
      next: (u: User) => (this.form = u),
      error: () => {
        this.message = 'Không tải được thông tin người dùng';
        this.isError = true;
      }
    });
  }

  saveProfile(): void {
    if (!this.auth.isLoggedIn() || !this.form) return;
    this.isSaving = true;
    this.message = '';
    
    this.api.updateMyProfile(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.message = 'Đã cập nhật hồ sơ cá nhân';
        this.isError = false;
      },
      error: () => {
        this.isSaving = false;
        this.message = 'Cập nhật thất bại';
        this.isError = true;
      }
    });
  }

  // Legacy method for compatibility
  save(): void {
    this.saveProfile();
  }

  onFileSelected(e: Event): void {
    this.onAvatarSelected(e);
  }

  onAvatarSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.uploadingAvatar = true;
    this.message = '';
    
    this.api.uploadMyAvatar(file).subscribe({
      next: (res) => {
        this.form.avatarUrl = res?.avatarUrl;
        this.uploadingAvatar = false;
        this.message = 'Đã cập nhật ảnh đại diện';
        this.isError = false;
      },
      error: () => {
        this.uploadingAvatar = false;
        this.message = 'Tải ảnh thất bại';
        this.isError = true;
      }
    });
  }

  changePassword(): void {
    if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
      this.passwordMessage = 'Vui lòng nhập đầy đủ thông tin';
      this.isPasswordError = true;
      return;
    }

    this.isChangingPassword = true;
    this.passwordMessage = '';

    this.api.changePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordMessage = 'Đã đổi mật khẩu thành công';
        this.isPasswordError = false;
        this.passwordForm = { oldPassword: '', newPassword: '' };
      },
      error: () => {
        this.isChangingPassword = false;
        this.passwordMessage = 'Đổi mật khẩu thất bại';
        this.isPasswordError = true;
      }
    });
  }

  getAvatarSrc(): string {
    const raw = String(this.form.avatarUrl || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `${this.api.getApiOrigin()}${raw}`;
    return raw;
  }
}
