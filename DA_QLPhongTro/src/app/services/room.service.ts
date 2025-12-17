import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  constructor(private api: HttpService) {}

  getRooms(ownerId?: number, hostelId?: number): Observable<Room[]> {
    return this.api.getRooms(ownerId, hostelId);
  }

  getById(id: number): Observable<Room> {
    return this.api.getRoomById(id);
  }

  create(body: Partial<Room>): Observable<Room> {
    return this.api.createRoom(body);
  }

  update(id: number, body: Partial<Room>): Observable<void> {
    return this.api.updateRoom(id, body);
  }

  updateImages(id: number, images: string[]): Observable<any> {
    return this.api.updateRoomImages(id, JSON.stringify(images));
  }

  delete(id: number): Observable<void> {
    return this.api.deleteRoom(id);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.api.updateRoomStatus(id, status);
  }
}
