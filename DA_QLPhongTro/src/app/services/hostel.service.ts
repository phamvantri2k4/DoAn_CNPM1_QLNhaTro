import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { Hostel } from '../models/hostel.model';

@Injectable({
  providedIn: 'root'
})
export class HostelService {
  constructor(private api: HttpService) {}

  getAll(ownerId?: number): Observable<Hostel[]> {
    return this.api.getHostels(ownerId);
  }

  getById(id: number): Observable<Hostel> {
    return this.api.getHostelById(id);
  }

  create(body: Partial<Hostel>): Observable<Hostel> {
    return this.api.createHostel(body);
  }

  update(id: number, body: Partial<Hostel>): Observable<void> {
    return this.api.updateHostel(id, body);
  }

  delete(id: number): Observable<void> {
    return this.api.deleteHostel(id);
  }
}
