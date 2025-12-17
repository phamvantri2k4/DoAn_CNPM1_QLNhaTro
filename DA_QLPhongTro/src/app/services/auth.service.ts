import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, LoginPayload, RegisterPayload, UserDto } from '../models/auth.model';
import { HttpService } from './http-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'pt_token';
  private readonly USER_KEY = 'pt_user';

  private currentUserSubject = new BehaviorSubject<UserDto | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpService, private router: Router) { }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.login(payload).pipe(
      tap((res) => {
        if (res.success && res.token && res.user) {
          this.persistSession(res.token, res.user);
        }
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.register(payload).pipe(
      tap((res) => {
        if (res.success && res.token && res.user) {
          this.persistSession(res.token, res.user);
        }
      })
    );
  }

  async validateSession(): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    try {
      const me = await firstValueFrom(this.http.getMyProfile());
      if (!me) throw new Error('No profile');
      this.persistSession(token, me as unknown as UserDto);
    } catch {
      this.clearSession();
      this.router.navigate(['/auth/login']);
    }
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login'], { queryParams: { message: 'Đã đăng xuất' } });
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    const id = this.getCurrentUser()?.id;
    return Number.isFinite(id) && Number(id) > 0 ? Number(id) : null;
  }

  isRenter(): boolean {
    return this.hasRole('renter');
  }

  hasRole(expected: string | string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    const roles = Array.isArray(expected) ? expected : [expected];
    return roles.some((r) => user.role?.toLowerCase() === r.toLowerCase());
  }

  private persistSession(token: string, user: UserDto): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadUser(): UserDto | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserDto;
    } catch {
      return null;
    }
  }
}