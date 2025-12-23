import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HostelService } from '../../services/hostel.service';
import { Hostel } from '../../models/hostel.model';

@Component({
  selector: 'app-host-hostel-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hostel-list.html',
  styleUrl: './hostel-list.css'
})
export class HostHostelListComponent {
  hostels: Hostel[] = [];
  message = '';
  isLoading = false;

  constructor(private hostelService: HostelService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.hostelService.getAll().subscribe({
      next: (data) => {
        this.hostels = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Không tải được danh sách trọ';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteHostel(hostel: Hostel): void {
    const hostelId = hostel.id ?? hostel.hostelId;
    if (!hostelId) {
      this.message = 'Không thể xóa: ID trọ không hợp lệ';
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa trọ "${hostel.name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    this.hostelService.delete(hostelId).subscribe({
      next: () => {
        this.message = 'Đã xóa trọ thành công';
        this.hostels = this.hostels.filter(h => (h.id ?? h.hostelId) !== hostelId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = `Lỗi khi xóa: ${err.error?.message || 'Không xóa được'}`;
        this.cdr.detectChanges();
      }
    });
  }

}
