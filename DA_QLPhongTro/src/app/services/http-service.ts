import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { LoginPayload, RegisterPayload, AuthResponse } from '../models/auth.model';
import { Room } from '../models/room.model';
import { Listing } from '../models/listing.model';
import { RentalRequest } from '../models/rental-request.model';
import { RentalInfo } from '../models/rental-info.model';
import { Review } from '../models/review.model';
import { User } from '../models/user.model';
import { Hostel } from '../models/hostel.model';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private readonly API_ORIGIN = 'http://localhost:5276';
  private readonly API_BASE = `${this.API_ORIGIN}/api`;

  getApiOrigin(): string {
    return this.API_ORIGIN;
  }
  
  private get jsonOptions() {
    const token = localStorage.getItem('pt_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  constructor(private http: HttpClient) {}

  // #region Auth
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/login`, payload, this.jsonOptions);
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/register`, payload, this.jsonOptions);
  }
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/auth/change-password`, { oldPassword, newPassword }, this.jsonOptions);
  }
  // #endregion

  // #region Profile
  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/profile/me`, this.jsonOptions);
  }

  updateMyProfile(body: Partial<User>): Observable<void> {
    return this.http.put<void>(`${this.API_BASE}/profile/me`, body, this.jsonOptions);
  }

  uploadMyAvatar(file: File): Observable<{ avatarUrl: string }> {
    const fd = new FormData();
    fd.append('file', file);

    const token = localStorage.getItem('pt_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const options = { headers };

    return this.http.post<{ avatarUrl: string }>(`${this.API_BASE}/profile/me/avatar`, fd, options);
  }
  // #endregion

  // #region Hostels (Tro)
  getHostels(ownerId?: number): Observable<Hostel[]> {
    const params = ownerId ? new HttpParams().set('ownerId', ownerId) : undefined;
    return this.http.get<Hostel[]>(`${this.API_BASE}/hostels`, { ...this.jsonOptions, params });
  }

  getHostelById(id: number): Observable<Hostel> {
    return this.http.get<Hostel>(`${this.API_BASE}/hostels/${id}`, this.jsonOptions);
  }

  createHostel(body: Partial<Hostel>): Observable<Hostel> {
    return this.http.post<Hostel>(`${this.API_BASE}/hostels`, body, this.jsonOptions);
  }

  updateHostel(id: number, body: Partial<Hostel>): Observable<void> {
    return this.http.put<void>(`${this.API_BASE}/hostels/${id}`, body, this.jsonOptions);
  }

  deleteHostel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/hostels/${id}`, this.jsonOptions);
  }
  // #endregion

  // #region Rooms
  getRooms(ownerId?: number, hostelId?: number): Observable<Room[]> {
    let params = new HttpParams();
    if (ownerId) params = params.set('ownerId', ownerId);
    if (hostelId) params = params.set('hostelId', hostelId);
    const options = { ...this.jsonOptions, params: params.keys().length ? params : undefined };
    return this.http.get<Room[]>(`${this.API_BASE}/rooms`, options);
  }

  getRoomById(id: number): Observable<Room> {
    return this.http.get<Room>(`${this.API_BASE}/rooms/${id}`, this.jsonOptions);
  }

  createRoom(body: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(`${this.API_BASE}/rooms`, body, this.jsonOptions);
  }

  updateRoom(id: number, body: Partial<Room>): Observable<void> {
    return this.http.put<void>(`${this.API_BASE}/rooms/${id}`, body, this.jsonOptions);
  }

  updateRoomImages(id: number, imagesJson: string | null): Observable<any> {
    return this.http.patch(`${this.API_BASE}/rooms/${id}/images`, { imagesJson }, this.jsonOptions);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/rooms/${id}`, this.jsonOptions);
  }

  updateRoomStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.API_BASE}/rooms/${id}/status`, { status }, this.jsonOptions);
  }

  uploadPostImage(file: File): Observable<{ url: string }> {
    const token = localStorage.getItem('pt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.API_BASE}/uploads/post-image`, formData, { headers });
  }

  // Dùng endpoint nhẹ /posts/list cho trang chủ để có sẵn ảnh đầu tiên, giảm dữ liệu và xử lý client
  getListings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE}/posts/list`, this.jsonOptions);
  }

  getMyListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.API_BASE}/posts/mine`, this.jsonOptions);
  }

  getListingById(id: number): Observable<Listing> {
    return this.http.get<Listing>(`${this.API_BASE}/posts/${id}`, this.jsonOptions);
  }

  createListing(body: Partial<Listing>): Observable<Listing> {
    return this.http.post<Listing>(`${this.API_BASE}/posts`, body, this.jsonOptions);
  }

  updateListing(id: number, body: Partial<Listing>): Observable<void> {
    return this.http.put<void>(`${this.API_BASE}/posts/${id}`, body, this.jsonOptions);
  }

  deleteListing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/posts/${id}`, this.jsonOptions);
  }

  updateListingStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.API_BASE}/posts/${id}/status`, { status }, this.jsonOptions);
  }

  getPostsByHost(hostId: number): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.API_BASE}/posts/host/${hostId}`, this.jsonOptions);
  }
  // #endregion

  // #region Rental Requests
  getRentalRequests(): Observable<RentalRequest[]> {
    return this.http.get<RentalRequest[]>(`${this.API_BASE}/rental-requests`, this.jsonOptions);
  }

  getPendingRentalRequestCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_BASE}/rental-requests/pending-count`, this.jsonOptions);
  }

  getMyRentalRequests(): Observable<RentalRequest[]> {
    return this.http.get<RentalRequest[]>(`${this.API_BASE}/rental-requests/my`, this.jsonOptions);
  }

  getRentalRequestById(id: number): Observable<RentalRequest> {
    return this.http.get<RentalRequest>(`${this.API_BASE}/rental-requests/${id}`, this.jsonOptions);
  }

  createRentalRequest(body: Partial<RentalRequest>): Observable<RentalRequest> {
    return this.http.post<RentalRequest>(`${this.API_BASE}/rental-requests`, body, this.jsonOptions);
  }

  updateRentalRequestStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.API_BASE}/rental-requests/${id}/status`, { status }, this.jsonOptions);
  }
  // #endregion

  // #region Rental Infos (history)
  getRentalInfos(): Observable<RentalInfo[]> {
    return this.http.get<RentalInfo[]>(`${this.API_BASE}/rental-infos`, this.jsonOptions);
  }

  getMyRentalInfos(): Observable<RentalInfo[]> {
    return this.http.get<RentalInfo[]>(`${this.API_BASE}/rental-infos/my`, this.jsonOptions);
  }

  getRentalInfoById(id: number): Observable<RentalInfo> {
    return this.http.get<RentalInfo>(`${this.API_BASE}/rental-infos/${id}`, this.jsonOptions);
  }

  getCurrentRentalInfo(roomId: number): Observable<any> {
    const params = new HttpParams().set('roomId', roomId);
    const options = { ...this.jsonOptions, params };
    return this.http.get<any>(`${this.API_BASE}/rental-infos/current`, options);
  }

  createRentalInfo(body: Partial<RentalInfo>): Observable<RentalInfo> {
    return this.http.post<RentalInfo>(`${this.API_BASE}/rental-infos`, body, this.jsonOptions);
  }

  updateRentalInfoStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.API_BASE}/rental-infos/${id}/status`, { status }, this.jsonOptions);
  }
  // #endregion

  // #region Reviews
  getReviews(roomId?: number): Observable<Review[]> {
    const params = roomId ? new HttpParams().set('roomId', roomId) : undefined;
    return this.http.get<Review[]>(`${this.API_BASE}/reviews`, { ...this.jsonOptions, params });
  }

  createReview(body: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(`${this.API_BASE}/reviews`, body, this.jsonOptions);
  }

  updateReview(id: number, body: Partial<Review>): Observable<void> {
    return this.http.put<void>(`${this.API_BASE}/reviews/${id}`, body, this.jsonOptions);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/reviews/${id}`, this.jsonOptions);
  }
  // #endregion

  // #region Users (admin)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_BASE}/users`, this.jsonOptions);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/users/${id}`, this.jsonOptions);
  }

  updateUser(id: number, body: Partial<User>): Observable<void> {
    return this.http.put<void>(`${this.API_BASE}/users/${id}`, body, this.jsonOptions);
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.patch(`${this.API_BASE}/users/${id}/toggle-status`, {}, this.jsonOptions);
  }
  // #endregion
}
