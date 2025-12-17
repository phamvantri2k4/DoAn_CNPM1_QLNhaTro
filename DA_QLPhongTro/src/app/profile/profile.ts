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

  constructor(private auth: AuthService, private api: HttpService, private dialog: DialogService) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.message = 'Bạn cần đăng nhập';
      return;
    }
    this.api.getMyProfile().subscribe({
      next: (u: User) => (this.form = u),
      error: () => (this.message = 'Không tải được thông tin người dùng')
    });
  }

  save(): void {
    if (!this.auth.isLoggedIn() || !this.form) return;
    this.dialog.loading('Đang lưu thay đổi...');
    this.api.updateMyProfile(this.form).subscribe({
      next: () => {
        this.dialog.close();
        this.dialog.success('Đã cập nhật hồ sơ cá nhân');
        this.message = '';
      },
      error: () => {
        this.dialog.close();
        this.dialog.error('Cập nhật thất bại');
      }
    });
  }

  onAvatarSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.uploadingAvatar = true;
    this.message = '';
    this.dialog.loading('Đang tải ảnh đại diện...');

    this.api.uploadMyAvatar(file).subscribe({
      next: (res) => {
        this.form.avatarUrl = res?.avatarUrl;
        this.uploadingAvatar = false;
        this.dialog.close();
        this.dialog.success('Đã cập nhật ảnh đại diện');
        this.message = '';
      },
      error: () => {
        this.uploadingAvatar = false;
        this.dialog.close();
        this.dialog.error('Tải ảnh thất bại');
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
