import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Room } from '../../models/room.model';
import { AuthService } from '../../services/auth.service';
import { RoomService } from '../../services/room.service';
import { RentalInfoService } from '../../services/rental-info.service';
import { CurrentRentalInfo } from '../../models/current-rental-info.model';
import { forkJoin, of, catchError, map } from 'rxjs';

@Component({
  selector: 'app-host-room-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './room-list.html',
  styleUrl: './room-list.css'
})
export class HostRoomListComponent {
  rooms: Room[] = [];
  loading = false;
  message = '';
  currentHostelId?: number;

  currentRenterByRoomId: Record<number, CurrentRentalInfo> = {};

  getRoomKey(r: Room): number | null {
    const n = Number(r.id ?? r.roomId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  getCurrentRenter(r: Room): CurrentRentalInfo | null {
    const key = this.getRoomKey(r);
    if (!key) return null;
    return this.currentRenterByRoomId[key] ?? null;
  }

  constructor(
    private roomService: RoomService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private rentalInfoService: RentalInfoService
  ) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.currentRenterByRoomId = {};
    const ownerId = this.auth.getCurrentUserId() ?? undefined;
    const hostelIdParam = this.route.snapshot.queryParamMap.get('hostelId');
    const hostelId = hostelIdParam ? Number(hostelIdParam) : undefined;
    this.currentHostelId = hostelId;
    this.roomService.getRooms(ownerId, hostelId).subscribe({
      next: (data) => {
        this.rooms = data;
        this.loading = false;

        const rentedRooms = (this.rooms || []).filter((r) => (r.status || '') === 'Đang thuê');
        if (!rentedRooms.length) {
          this.cdr.detectChanges();
          return;
        }

        const calls = rentedRooms
          .map((r) => this.getRoomKey(r))
          .filter((id): id is number => typeof id === 'number' && id > 0)
          .map((roomId) =>
            this.rentalInfoService.getCurrentForRoom(roomId).pipe(
              map((dto) => ({ roomId, dto })),
              catchError(() => of({ roomId, dto: null }))
            )
          );

        forkJoin(calls).subscribe({
          next: (results) => {
            for (const r of results) {
              if (r.dto) this.currentRenterByRoomId[r.roomId] = r.dto;
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tải được danh sách phòng';
        this.cdr.detectChanges();
      }
    });
  }

  delete(room: Room): void {
    const id = room.id || room.roomId;
    if (!id) return;
    if (!confirm('Xóa phòng này?')) return;
    this.roomService.delete(id).subscribe({
      next: () => {
        this.message = 'Đã xóa phòng';
        this.fetch();
      },
      error: () => (this.message = 'Xóa thất bại')
    });
  }
}

