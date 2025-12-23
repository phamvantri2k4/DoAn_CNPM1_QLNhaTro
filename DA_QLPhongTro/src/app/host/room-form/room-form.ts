import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Room } from '../../models/room.model';
import { RoomService } from '../../services/room.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-host-room-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './room-form.html',
  styleUrl: './room-form.css'
})
export class HostRoomFormComponent {
  form: Partial<Room> = {
    title: '',
    area: 20,
    price: 1000000,
    deposit: 500000,
    utilitiesDescription: ''
  };
  isEdit = false;
  message = '';
  currentHostelId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const preHostelId = this.route.snapshot.queryParamMap.get('hostelId');
    this.currentHostelId = preHostelId ? Number(preHostelId) : undefined;

    // Nếu tạo mới phòng thì bắt buộc có hostelId (tạo từ trong trọ)
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      if (!this.currentHostelId) {
        this.message = 'Hãy vào trọ và bấm "Thêm phòng" để tạo phòng thuộc trọ đó.';
        return;
      }
      this.form.hostelId = this.currentHostelId;
    }

    if (id) {
      this.isEdit = true;
      this.roomService.getById(Number(id)).subscribe({
        next: (res) => (this.form = res),
        error: () => (this.message = 'Không tải được phòng')
      });
    }
  }

  submit(): void {
    if (!this.isEdit && !this.form.hostelId) {
      this.message = 'Thiếu trọ. Hãy tạo phòng từ trong trọ.';
      return;
    }

    if (this.isEdit) {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) return;
      this.roomService.update(Number(id), this.form).subscribe({
        next: () => {
          this.message = 'Đã cập nhật phòng';
          // Giữ lại hostelId query param để lọc đúng danh sách phòng
          this.router.navigate(['/host/rooms'], {
            queryParams: this.form.hostelId ? { hostelId: this.form.hostelId } : undefined
          });
        },
        error: () => (this.message = 'Cập nhật thất bại')
      });
    } else {
      this.roomService.create(this.form).subscribe({
        next: () => {
          this.message = 'Đã tạo phòng';
          this.router.navigate(['/host/rooms'], {
            queryParams: this.form.hostelId ? { hostelId: this.form.hostelId } : undefined
          });
        },
        error: () => (this.message = 'Tạo phòng thất bại')
      });
    }
  }
}

