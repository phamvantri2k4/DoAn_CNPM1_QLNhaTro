import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Listing } from '../../models/listing.model';
import { Room } from '../../models/room.model';
import { Review } from '../../models/review.model';
import { ListingService } from '../../services/listing.service';
import { RoomService } from '../../services/room.service';
import { RentalRequestService } from '../../services/rental-request.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';
import { DialogService } from '../../components/dialog/dialog.service';
import { UserDto } from '../../models/auth.model';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './listing-detail.html',
  styleUrl: './listing-detail.css'
})
export class ListingDetailComponent {
  listing?: Listing;
  room?: Room;
  images: string[] = [];

  lightboxOpen = false;
  lightboxIndex = 0;

  reviews: Review[] = [];
  reviewLoading = false;

  sendingRequest = false;

  showRequestForm = false;

  loading = false;
  message = '';

  request = {
    note: ''
  };

  openRequestForm(): void {
    if (!this.canSendRequest) return;
    this.showRequestForm = true;
  }

  closeRequestForm(): void {
    this.showRequestForm = false;
    this.request.note = '';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private roomService: RoomService,
    private rentalRequestService: RentalRequestService,
    private auth: AuthService,
    private reviewService: ReviewService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.loading = true;
    this.listingService.getById(id).subscribe({
      next: (data) => {
        this.listing = data;
        this.images = this.parseListingImages(data);
        this.loadRoom(data.roomId);
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tải được bài đăng';
      }
    });
  }

  private loadRoom(roomId: number): void {
    this.roomService.getById(roomId).subscribe({
      next: (r) => {
        this.room = r;
        this.loading = false;
        this.loadReviews(roomId);
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tải được thông tin phòng';
      }
    });
  }

  private loadReviews(roomId: number): void {
    if (!roomId) return;
    this.reviewLoading = true;
    this.reviewService.getByRoom(roomId).subscribe({
      next: (data) => {
        const items = data || [];
        this.reviews = this.sortReviews(items);
        this.reviewLoading = false;
      },
      error: () => {
        this.reviews = [];
        this.reviewLoading = false;
      }
    });
  }

  private sortReviews(items: Review[]): Review[] {
    const copy = [...(items || [])];
    copy.sort((a, b) => {
      const da = a.createdAt || a.reviewedAt;
      const db = b.createdAt || b.reviewedAt;
      const ta = da ? Date.parse(String(da)) : 0;
      const tb = db ? Date.parse(String(db)) : 0;
      return tb - ta;
    });
    return copy;
  }

  get averageRating(): number {
    if (!this.reviews?.length) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return sum / this.reviews.length;
  }

  get averageRatingText(): string {
    const avg = this.averageRating;
    return avg ? avg.toFixed(1) : '0.0';
  }

  getStars(n: number): number[] {
    const count = Math.max(0, Math.min(5, Math.round(n)));
    return Array.from({ length: count }, (_, i) => i);
  }

  getEmptyStars(n: number): number[] {
    const count = Math.max(0, 5 - Math.max(0, Math.min(5, Math.round(n))));
    return Array.from({ length: count }, (_, i) => i);
  }

  private parseListingImages(listing: Listing): string[] {
    if (listing.images && listing.images.length) return listing.images;
    if (listing.imagesJson) {
      try {
        const arr = JSON.parse(listing.imagesJson);
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  get lightboxImage(): string {
    const i = Math.max(0, Math.min(this.images.length - 1, this.lightboxIndex));
    return this.images[i] || '';
  }

  openLightbox(index: number): void {
    if (!this.images?.length) return;
    this.lightboxIndex = Math.max(0, Math.min(this.images.length - 1, Number(index) || 0));
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  prevLightbox(): void {
    if (!this.images?.length) return;
    this.lightboxIndex = (this.lightboxIndex - 1 + this.images.length) % this.images.length;
  }

  nextLightbox(): void {
    if (!this.images?.length) return;
    this.lightboxIndex = (this.lightboxIndex + 1) % this.images.length;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (ev.key === 'Escape') this.closeLightbox();
    else if (ev.key === 'ArrowLeft') this.prevLightbox();
    else if (ev.key === 'ArrowRight') this.nextLightbox();
  }

  sendRequest(): void {
    if (!this.auth.isRenter()) {
      this.dialog.error('Chỉ tài khoản người thuê mới gửi được yêu cầu thuê');
      return;
    }
    if (!this.room) return;
    const roomId = this.room.roomId || this.room.id;
    if (!roomId) return;
    const user = this.auth.getCurrentUser();
    const contactNote = `Nguoi thue: ${user?.fullName || ''}\nSDT: ${user?.phone || ''}\nEmail: ${user?.email || ''}\n\nGhi chu: ${this.request.note || ''}`.trim();

    if (this.sendingRequest) return;
    this.sendingRequest = true;
    this.message = '';
    this.rentalRequestService
      .create({
        roomId,
        requestType: 'RENT',
        note: contactNote
      })
      .subscribe({
        next: () => {
          this.dialog.success('Đã gửi yêu cầu thuê. Vui lòng chờ chủ trọ duyệt.', 'Thành công', () => {
            this.router.navigate(['/renter/rental-history'], { queryParams: { tab: 'PENDING' } });
          });
          this.sendingRequest = false;
          this.showRequestForm = false;
          this.request.note = '';
        },
        error: (err) => {
          const status = err?.status;
          const backendMsg = err?.error?.message;
          if (status === 401) this.dialog.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          else if (status === 403) this.dialog.error('Chỉ tài khoản người thuê (renter) mới gửi được yêu cầu thuê.');
          else if (status === 400) this.dialog.error(backendMsg ? `Gửi yêu cầu thất bại: ${backendMsg}` : 'Gửi yêu cầu thất bại (dữ liệu không hợp lệ)');
          else this.dialog.error('Gửi yêu cầu thất bại');

          this.sendingRequest = false;
        }
      });
  }

  get loggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get currentUser(): UserDto | null {
    return this.auth.getCurrentUser();
  }

  get canSendRequest(): boolean {
    return this.auth.isRenter();
  }
}
