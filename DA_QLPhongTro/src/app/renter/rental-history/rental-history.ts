import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { RentalInfo } from '../../models/rental-info.model';
import { RentalRequest } from '../../models/rental-request.model';
import { RentalInfoService } from '../../services/rental-info.service';
import { RentalRequestService } from '../../services/rental-request.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../components/dialog/dialog.service';
import { Room } from '../../models/room.model';
import { Hostel } from '../../models/hostel.model';

@Component({
  selector: 'app-rental-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rental-history.html',
  styleUrl: './rental-history.css'
})
export class RentalHistoryComponent {
  items: RentalInfo[] = [];
  pendingRequests: RentalRequest[] = [];
  loading = false;
  error = '';
  message = '';

  activeTab: 'ACTIVE' | 'ENDED' | 'PENDING_RENT' | 'PENDING_RETURN' | 'PROCESSED' = 'ACTIVE';

  returnNote: Record<number, string> = {};
  reviewDraft: Record<number, { rating: number; comment: string }> = {};

  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private rentalInfoService: RentalInfoService,
    private rentalRequestService: RentalRequestService,
    private reviewService: ReviewService,
    private auth: AuthService,
    private dialog: DialogService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tab = String(this.route.snapshot.queryParamMap.get('tab') || '').toUpperCase();
    if (tab === 'PENDING') this.activeTab = 'PENDING_RENT';
    if (tab === 'ENDED') this.activeTab = 'ENDED';
    this.fetch();

    this.timer = setInterval(() => this.fetch(), 10000);

    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  private handleFocus = () => {
    this.fetch();
  };

  private handleVisibility = () => {
    if (document.visibilityState === 'visible') this.fetch();
  };

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.message = '';

    let done1 = false;
    let done2 = false;
    const done = () => {
      if (done1 && done2) this.loading = false;
    };

    // Lấy lịch sử thuê của renter hiện tại
    this.rentalInfoService.getMine().subscribe({
      next: (data: RentalInfo[]) => {
        this.items = this.sortRentalInfos(data || []);
        done1 = true;
        done();
      },
      error: () => {
        this.error = 'Không tải được lịch sử thuê';
        done1 = true;
        done();
      }
    });

    // Lấy danh sách yêu cầu (để hiển thị chờ duyệt)
    this.rentalRequestService.getMine().subscribe({
      next: (data) => {
        this.pendingRequests = this.sortRequests(data || []);
        done2 = true;
        done();
      },
      error: () => {
        this.pendingRequests = [];
        done2 = true;
        done();
      }
    });
  }

  setTab(tab: 'ACTIVE' | 'ENDED' | 'PENDING_RENT' | 'PENDING_RETURN' | 'PROCESSED'): void {
    this.activeTab = tab;
    this.error = '';
    this.message = '';
  }

  get activeRentals(): RentalInfo[] {
    return (this.items || []).filter((x) => this.canReturn(x));
  }

  get endedRentals(): RentalInfo[] {
    return (this.items || []).filter((x) => this.canReview(x));
  }

  get pendingRentRequests(): RentalRequest[] {
    return (this.pendingRequests || []).filter(
      (r) => this.normalizeStatus(r.status) === 'PENDING' && this.normalizeType(r.requestType) === 'RENT'
    );
  }

  get pendingReturnRequests(): RentalRequest[] {
    return (this.pendingRequests || []).filter(
      (r) => this.normalizeStatus(r.status) === 'PENDING' && this.normalizeType(r.requestType) === 'RETURN'
    );
  }

  get processedRequests(): RentalRequest[] {
    return (this.pendingRequests || []).filter((r) => this.normalizeStatus(r.status) !== 'PENDING');
  }

  get pendingRentCount(): number {
    return (this.pendingRentRequests || []).length;
  }

  get pendingReturnCount(): number {
    return (this.pendingReturnRequests || []).length;
  }

  get processedCount(): number {
    return (this.processedRequests || []).length;
  }

  normalizeStatus(s: unknown): string {
    const v = String(s || '').toUpperCase();
    if (v.includes('ACCEPT') || v.includes('CHẤP')) return 'ACCEPTED';
    if (v.includes('REJECT') || v.includes('TỪ CHỐI')) return 'REJECTED';
    return v || 'PENDING';
  }

  getRequestStatusLabel(status: unknown): string {
    const s = this.normalizeStatus(status);
    if (s === 'PENDING') return 'Chờ duyệt';
    if (s === 'ACCEPTED') return 'Đã chấp nhận';
    if (s === 'REJECTED') return 'Đã từ chối';
    return String(status || '');
  }

  normalizeType(t: unknown): 'RENT' | 'RETURN' {
    const s = String(t || '').toUpperCase();
    if (s.includes('RETURN') || s.includes('TRẢ')) return 'RETURN';
    return 'RENT';
  }

  private sortRequests(items: RentalRequest[]): RentalRequest[] {
    const copy = [...(items || [])];
    copy.sort((a, b) => this.getSentTime(b) - this.getSentTime(a));
    return copy;
  }

  private getSentTime(r: RentalRequest): number {
    const raw = r.sentAt || r.sentDate;
    const t = raw ? Date.parse(String(raw)) : NaN;
    return Number.isFinite(t) ? t : 0;
  }

  private sortRentalInfos(items: RentalInfo[]): RentalInfo[] {
    const copy = [...(items || [])];
    copy.sort((a, b) => {
      const da = a.startDate ? Date.parse(String(a.startDate)) : 0;
      const db = b.startDate ? Date.parse(String(b.startDate)) : 0;
      return db - da;
    });
    return copy;
  }

  getRoomTitle(x: RentalInfo): string {
    const r = x.room as Room | undefined;
    return r?.title || `Phòng #${x.roomId}`;
  }

  getRoomAddress(x: RentalInfo): string {
    const r = x.room as (Room & { hostel?: Hostel }) | undefined;
    return r?.hostel?.address || '';
  }

  canReturn(x: RentalInfo): boolean {
    return (x.status || '').toLowerCase().includes('đang thuê');
  }

  canReview(x: RentalInfo): boolean {
    return (x.status || '').toLowerCase().includes('đã kết thúc');
  }

  sendReturnRequest(x: RentalInfo): void {
    if (!this.canReturn(x)) return;

    if (!this.auth.isRenter()) {
      this.dialog.error('Chỉ tài khoản người thuê mới gửi được yêu cầu trả phòng');
      return;
    }

    const note = (this.returnNote[x.id] || '').trim();
    const user = this.auth.getCurrentUser();
    const contactNote = `Nguoi thue: ${user?.fullName || ''}\nSDT: ${user?.phone || ''}\nEmail: ${user?.email || ''}\n\nGhi chu: ${note}`.trim();
    this.rentalRequestService
      .create({
        roomId: x.roomId,
        requestType: 'RETURN',
        note: contactNote
      })
      .subscribe({
        next: () => {
          this.dialog.success('Đã gửi yêu cầu trả phòng. Vui lòng chờ chủ trọ duyệt.');
          this.activeTab = 'PENDING_RETURN';
          this.fetch();
        },
        error: () => {
          this.dialog.error('Gửi yêu cầu trả phòng thất bại');
        }
      });
  }

  getReviewDraft(x: RentalInfo): { rating: number; comment: string } {
    if (!this.reviewDraft[x.id]) {
      this.reviewDraft[x.id] = { rating: 5, comment: '' };
    }
    return this.reviewDraft[x.id];
  }

  submitReview(x: RentalInfo): void {
    if (!this.canReview(x)) return;

    const draft = this.getReviewDraft(x);
    const rating = Number(draft.rating) || 5;
    const comment = (draft.comment || '').trim();

    this.reviewService
      .create({
        roomId: x.roomId,
        rating,
        comment
      })
      .subscribe({
        next: () => {
          this.dialog.success('Đã gửi đánh giá');
          this.reviewDraft[x.id] = { rating: 5, comment: '' };
        },
        error: () => {
          this.dialog.error('Không gửi được đánh giá');
        }
      });
  }
}
