import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterPayload } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  form: RegisterPayload = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'renter'
  };

  message = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.loading = true;
    this.auth.register(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.message = 'Đăng ký thành công';
          this.router.navigate(['/home']);
        } else {
          this.message = res.message || 'Đăng ký thất bại';
        }
      },
      error: () => {
        this.loading = false;
        this.message = 'Có lỗi xảy ra, vui lòng thử lại';
      }
    });
  }
}

