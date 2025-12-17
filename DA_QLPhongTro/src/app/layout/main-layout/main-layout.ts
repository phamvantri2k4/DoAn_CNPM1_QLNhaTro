import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { UserDto } from '../../models/auth.model';
import { DialogHostComponent } from '../../components/dialog/dialog-host';
import { RentalRequestService } from '../../services/rental-request.service';
import { HttpService } from '../../services/http-service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, DialogHostComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {
  user$: Observable<UserDto | null>;

  pendingRequestCount = 0;
  private pendingSub?: Subscription;
  private pollTimer?: ReturnType<typeof setInterval>;
  private focusHandler?: () => void;
  private userSub?: Subscription;

  constructor(
    private auth: AuthService,
    private rentalRequests: RentalRequestService,
    private api: HttpService
  ) {
    this.user$ = this.auth.currentUser$;
  }

  ngOnInit(): void {
    // Always reflect latest value without needing page reload
    this.pendingSub = this.rentalRequests.pendingCount$.subscribe((n) => {
      this.pendingRequestCount = Math.max(0, Number(n) || 0);
    });

    // Start/stop polling based on user role
    this.userSub = this.user$.subscribe((u) => {
      const role = String(u?.role || '').toLowerCase();
      const shouldPoll = !!u && (role === 'owner' || role === 'admin');

      if (!shouldPoll) {
        this.stopPolling();
        this.pendingRequestCount = 0;
        return;
      }

      this.startPolling();
      this.refreshPending();
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.pendingSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  private refreshPending(): void {
    this.rentalRequests.refreshPendingCount().subscribe();
  }

  private startPolling(): void {
    if (this.pollTimer) return;

    // Poll mỗi 10s để badge cập nhật
    this.pollTimer = setInterval(() => this.refreshPending(), 10000);

    // Refresh khi user quay lại tab/window
    this.focusHandler = () => this.refreshPending();
    window.addEventListener('focus', this.focusHandler);
    document.addEventListener('visibilitychange', this.focusHandler);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      document.removeEventListener('visibilitychange', this.focusHandler);
      this.focusHandler = undefined;
    }
  }

  logout(): void {
    this.auth.logout();
  }

  hasRole(role: string | string[]): boolean {
    return this.auth.hasRole(role);
  }

  getUserAvatarSrc(user: UserDto | null): string {
    const raw = String(user?.avatarUrl || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `${this.api.getApiOrigin()}${raw}`;
    return raw;
  }
}

