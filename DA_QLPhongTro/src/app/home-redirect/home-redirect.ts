import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="home-redirect">Đang chuyển trang...</div>',
  styles: [
    '.home-redirect{padding:20px;text-align:center;color:#6b7280;font-size:14px;}'
  ]
})
export class HomeRedirectComponent {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    const role = String(user?.role || '').toLowerCase();

    if (role === 'owner') {
      this.router.navigate(['/listings']);
      return;
    }

    if (role === 'admin') {
      this.router.navigate(['/listings']);
      return;
    }

    if (role === 'renter') {
      this.router.navigate(['/listings']);
      return;
    }

    this.router.navigate(['/auth/login']);
  }
}
