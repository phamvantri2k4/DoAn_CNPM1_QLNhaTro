import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  constructor(private api: HttpService) {}

  getAll(): Observable<User[]> {
    return this.api.getUsers();
  }

  getById(id: number): Observable<User> {
    return this.api.getUserById(id);
  }

  update(id: number, body: Partial<User>): Observable<void> {
    return this.api.updateUser(id, body);
  }

  toggleStatus(id: number): Observable<any> {
    return this.api.toggleUserStatus(id);
  }
}
