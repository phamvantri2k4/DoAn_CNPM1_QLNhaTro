import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Room } from '../../models/room.model';
import { AuthService } from '../../services/auth.service';
import { RoomService } from '../../services/room.service';
import { RentalRequestService } from '../../services/rental-request.service';
import { RentalInfoService } from '../../services/rental-info.service';
import { DialogService } from '../../components/dialog/dialog.service';
import { UserDto } from '../../models/auth.model';
import { CurrentRentalInfo } from '../../models/current-rental-info.model';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-detail.html',
  styleUrl: './room-detail.css'
})
export class RoomDetailComponent {
  room?: Room;
  loading = false;
  message = '';

  currentRentalInfo: CurrentRentalInfo | null = null;

  sendingRequest = false;

  showRequestForm = false;

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
    private roomService: RoomService,
    private rentalRequestService: RentalRequestService,
    private rentalInfoService: RentalInfoService,
    private auth: AuthService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadRoom(id);
    }
  }

  loadRoom(id: number): void {
    this.loading = true;
    this.currentRentalInfo = null;
    this.roomService.getById(id).subscribe({
      next: (res) => {
        this.room = res;
        this.loading = false;
        this.loadCurrentRenterIfNeeded();
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tìm thấy phòng';
      }
    });
  }

  private loadCurrentRenterIfNeeded(): void {
    if (!this.room) return;
    if (!this.isOwner) return;

    const status = String(this.room.status || '').trim();
    if (status !== 'Đang thuê') return;

    const roomId = Number(this.room.roomId ?? this.room.id);
    if (!Number.isFinite(roomId) || roomId <= 0) return;

    this.rentalInfoService.getCurrentForRoom(roomId).subscribe({
      next: (dto) => {
        this.currentRentalInfo = dto;
      },
      error: () => {
        this.currentRentalInfo = null;
      }
    });
  }

  sendRequest(): void {
    if (!this.auth.isRenter()) {
      this.dialog.error('Chỉ tài khoản người thuê mới gửi được yêu cầu thuê');
      return;
    }
    if (!this.room) return;

    if (this.sendingRequest) return;
    this.sendingRequest = true;
    const user = this.auth.getCurrentUser();
    const contactNote = `Nguoi thue: ${user?.fullName || ''}\nSDT: ${user?.phone || ''}\nEmail: ${user?.email || ''}\n\nGhi chu: ${this.request.note || ''}`.trim();

    this.rentalRequestService
      .create({
        roomId: this.room.roomId || this.room.id!,
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
        error: () => {
          this.sendingRequest = false;
          this.dialog.error('Gửi yêu cầu thất bại');
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

  get isOwner(): boolean {
    const user = this.auth.getCurrentUser();
    const role = String(user?.role || '').toLowerCase();
    return role === 'owner' || role === 'host';
  }
}

