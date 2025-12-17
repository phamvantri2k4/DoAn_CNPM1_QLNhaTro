import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { RentalInfo } from '../models/rental-info.model';
import { CurrentRentalInfo } from '../models/current-rental-info.model';

@Injectable({
  providedIn: 'root'
})
export class RentalInfoService {
  constructor(private api: HttpService) {}

  getMine(): Observable<RentalInfo[]> {
    return this.api.getMyRentalInfos();
  }

  getAll(): Observable<RentalInfo[]> {
    return this.api.getRentalInfos();
  }

  getById(id: number): Observable<RentalInfo> {
    return this.api.getRentalInfoById(id);
  }

  getCurrentForRoom(roomId: number): Observable<CurrentRentalInfo> {
    return this.api.getCurrentRentalInfo(roomId);
  }

  create(body: Partial<RentalInfo>): Observable<RentalInfo> {
    return this.api.createRentalInfo(body);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.api.updateRentalInfoStatus(id, status);
  }
}
