import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { tap } from 'rxjs';

// Attach JWT token to every request if available and handle auth errors
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Only attach token to our backend API requests.
  // External calls (e.g. provinces.open-api.vn) can fail CORS/preflight if we inject Authorization.
  const backendOrigin = 'http://localhost:5276';
  const isBackendRequest = req.url.startsWith(backendOrigin) || req.url.startsWith('/api/');

  if (token && isBackendRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    tap({
      error: (error) => {
        // Auto-logout on 401 (Unauthorized) or 403 (Forbidden)
        if (isBackendRequest && (error.status === 401 || error.status === 403)) {
          auth.logout();
        }
      }
    })
  );
};

