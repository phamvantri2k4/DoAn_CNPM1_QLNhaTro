import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  constructor(private api: HttpService) {}

  getByRoom(roomId: number): Observable<Review[]> {
    return this.api.getReviews(roomId);
  }

  create(body: Partial<Review>): Observable<Review> {
    return this.api.createReview(body);
  }

  update(id: number, body: Partial<Review>): Observable<void> {
    return this.api.updateReview(id, body);
  }

  delete(id: number): Observable<void> {
    return this.api.deleteReview(id);
  }
}
