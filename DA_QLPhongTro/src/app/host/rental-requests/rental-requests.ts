import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentalRequest } from '../../models/rental-request.model';
import { RentalRequestService } from '../../services/rental-request.service';
import { DialogService } from '../../components/dialog/dialog.service';

@Component({
  selector: 'app-host-rental-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rental-requests.html',
  styleUrl: './rental-requests.css'
})
export class HostRentalRequestsComponent {
  requests: RentalRequest[] = [];
  message = '';
  loading = false;

  activeTab: 'PENDING_RENT' | 'PENDING_RETURN' | 'PROCESSED' = 'PENDING_RENT';

  constructor(private rentalRequestService: RentalRequestService, private dialog: DialogService) {}

  ngOnInit(): void {
    this.fetch();
  }

  setTab(tab: 'PENDING_RENT' | 'PENDING_RETURN' | 'PROCESSED'): void {
    this.activeTab = tab;
    this.message = '';
  }

  private normalizeType(t: unknown): 'RENT' | 'RETURN' {
    const s = String(t || '').toUpperCase();
    if (s.includes('RETURN') || s.includes('TRẢ')) return 'RETURN';
    return 'RENT';
  }

  private normalizeStatus(s: unknown): string {
    const v = String(s || '').toUpperCase();
    if (v.includes('ACCEPT') || v.includes('CHẤP')) return 'ACCEPTED';
    if (v.includes('REJECT') || v.includes('TỪ CHỐI')) return 'REJECTED';
    return v || 'PENDING';
  }

  getStatusLabel(s: unknown): string {
    const st = this.normalizeStatus(s);
    if (st === 'PENDING') return 'Chờ duyệt';
    if (st === 'ACCEPTED') return 'Đã chấp nhận';
    if (st === 'REJECTED') return 'Đã từ chối';
    return String(s || '');
  }

  isAcceptedStatus(s: unknown): boolean {
    return this.normalizeStatus(s) === 'ACCEPTED';
  }

  isRejectedStatus(s: unknown): boolean {
    return this.normalizeStatus(s) === 'REJECTED';
  }

  get pendingRentRequests(): RentalRequest[] {
    return this.sortNewestFirst(
      (this.requests || []).filter(
        (r) => this.normalizeType(r.requestType) === 'RENT' && this.isPending(r)
      )
    );
  }

  get pendingReturnRequests(): RentalRequest[] {
    return this.sortNewestFirst(
      (this.requests || []).filter(
        (r) => this.normalizeType(r.requestType) === 'RETURN' && this.isPending(r)
      )
    );
  }

  get processedRequests(): RentalRequest[] {
    return this.sortNewestFirst(
      (this.requests || []).filter((r) => !this.isPending(r))
    );
  }

  get pendingRentCount(): number {
    return (this.requests || []).filter(
      (r) => this.normalizeType(r.requestType) === 'RENT' && this.isPending(r)
    ).length;
  }

  get pendingReturnCount(): number {
    return (this.requests || []).filter(
      (r) => this.normalizeType(r.requestType) === 'RETURN' && this.isPending(r)
    ).length;
  }

  get processedCount(): number {
    return (this.requests || []).filter((r) => !this.isPending(r)).length;
  }

  private sortNewestFirst(items: RentalRequest[]): RentalRequest[] {
    const copy = [...(items || [])];
    copy.sort((a, b) => {
      const da = this.getSentTime(a);
      const db = this.getSentTime(b);
      return db - da;
    });
    return copy;
  }

  private getSentTime(r: RentalRequest): number {
    const raw = r.sentAt || r.sentDate;
    const t = raw ? Date.parse(String(raw)) : NaN;
    return Number.isFinite(t) ? t : 0;
  }

  isPending(r: RentalRequest): boolean {
    return this.normalizeStatus(r.status) === 'PENDING';
  }

  fetch(): void {
    this.loading = true;
    this.rentalRequestService.getAll().subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tải được yêu cầu';
      }
    });
  }

  updateStatus(req: RentalRequest, status: 'ACCEPTED' | 'REJECTED'): void {
    const id = req.requestId || req.id;
    if (!id) {
      this.dialog.error('Không tìm thấy ID yêu cầu');
      return;
    }
    const actionText = status === 'ACCEPTED' ? 'chấp nhận' : 'từ chối';
    this.dialog.confirm(`Bạn chắc chắn muốn ${actionText} yêu cầu này?`, {
      title: 'Xác nhận',
      confirmText: status === 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối',
      cancelText: 'Hủy',
      onConfirm: () => {
        this.rentalRequestService.updateStatus(id, status).subscribe({
          next: () => {
            this.fetch();
            this.rentalRequestService.refreshPendingCount().subscribe();
            this.dialog.success(status === 'ACCEPTED' ? 'Đã chấp nhận yêu cầu' : 'Đã từ chối yêu cầu');
          },
          error: () => this.dialog.error('Cập nhật thất bại')
        });
      }
    });
  }
}

