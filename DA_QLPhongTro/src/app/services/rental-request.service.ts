import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { HttpService } from './http-service';
import { RentalRequest } from '../models/rental-request.model';

@Injectable({
  providedIn: 'root'
})
export class RentalRequestService {
  private pendingCountSubject = new BehaviorSubject<number>(0);
  pendingCount$ = this.pendingCountSubject.asObservable();

  constructor(private api: HttpService) {}

  getAll(): Observable<RentalRequest[]> {
    return this.api.getRentalRequests();
  }

  getPendingCount(): Observable<{ count: number }> {
    return this.api.getPendingRentalRequestCount();
  }

  refreshPendingCount(): Observable<number> {
    return this.getPendingCount().pipe(
      map((x) => Math.max(0, Number(x?.count) || 0)),
      catchError(() => of(0)),
      tap((n) => this.pendingCountSubject.next(n))
    );
  }

  getMine(): Observable<RentalRequest[]> {
    return this.api.getMyRentalRequests();
  }

  getById(id: number): Observable<RentalRequest> {
    return this.api.getRentalRequestById(id);
  }

  create(body: Partial<RentalRequest>): Observable<RentalRequest> {
    return this.api.createRentalRequest(body);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.api.updateRentalRequestStatus(id, status);
  }
}
