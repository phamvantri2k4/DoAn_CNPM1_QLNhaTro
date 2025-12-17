import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoginPayload } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  form: LoginPayload = {
    usernameOrEmail: '',
    password: ''
  };
  message = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.message = params['message'];
      }
    });
  }

  submit(): void {
    if (!this.form.usernameOrEmail || !this.form.password) {
      this.message = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }
    this.loading = true;
    this.auth.login(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.message = 'Đăng nhập thành công';
          this.router.navigate(['/home']);
        } else {
          this.message = res.message || 'Đăng nhập thất bại';
        }
      },
      error: () => {
        this.loading = false;
        this.message = 'Có lỗi xảy ra, vui lòng thử lại';
      }
    });
  }
}

