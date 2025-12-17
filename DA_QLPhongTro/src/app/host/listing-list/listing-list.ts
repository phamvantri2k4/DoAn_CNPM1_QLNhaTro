import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListingService } from '../../services/listing.service';
import { Listing } from '../../models/listing.model';

@Component({
  selector: 'app-host-listing-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listing-list.html',
  styleUrl: './listing-list.css'
})
export class HostListingListComponent {
  listings: Listing[] = [];
  message = '';
  isLoading = false;

  constructor(private listingService: ListingService) {}

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    this.listingService.getMine().subscribe({
      next: (data: Listing[]) => {
        this.listings = data;
      },
      error: () => {
        this.message = 'Không tải được danh sách bài đăng';
      }
    });
  }

  deletePost(id: number): void {
    if (!confirm('Bạn có chắc muốn xóa bài đăng này?')) return;
    
    this.listingService.delete(id).subscribe({
      next: () => {
        this.message = 'Đã xóa bài đăng';
        this.loadListings();
      },
      error: () => {
        this.message = 'Xóa thất bại';
      }
    });
  }

  toggleStatus(id: number, currentStatus: string): void {
    const newStatus = currentStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    this.listingService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.message = `Đã ${newStatus === 'VISIBLE' ? 'hiển thị' : 'ẩn'} bài đăng`;
        this.loadListings();
      },
      error: () => {
        this.message = 'Cập nhật trạng thái thất bại';
      }
    });
  }
}
