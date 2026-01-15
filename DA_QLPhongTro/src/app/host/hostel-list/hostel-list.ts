import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HostelService } from '../../services/hostel.service';
import { Hostel } from '../../models/hostel.model';
import { DialogService } from '../../components/dialog/dialog.service';

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

  constructor(private hostelService: HostelService, private cdr: ChangeDetectorRef, private dialog: DialogService) {}

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
      this.dialog.error('Không thể xóa: ID trọ không hợp lệ');
      return;
    }

    this.dialog.confirm(`Bạn có chắc muốn xóa trọ "${hostel.name}"?`, {
      title: 'Xác nhận xóa trọ',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      onConfirm: () => {
        this.hostelService.delete(hostelId).subscribe({
          next: () => {
            this.hostels = this.hostels.filter(h => (h.id ?? h.hostelId) !== hostelId);
            this.cdr.detectChanges();
            this.dialog.success('Đã xóa trọ thành công');
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Không xóa được trọ';
            this.dialog.error(errorMsg);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

}
