import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingService } from '../../services/listing.service';
import { HostelService } from '../../services/hostel.service';
import { Listing } from '../../models/listing.model';
import { Hostel } from '../../models/hostel.model';

@Component({
  selector: 'app-host-listing-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './listing-list.html',
  styleUrl: './listing-list.css'
})
export class HostListingListComponent {
  listings: Listing[] = [];
  filteredListings: Listing[] = [];
  hostels: Hostel[] = [];
  selectedHostelId: number | null = null;
  message = '';
  isLoading = false;

  constructor(
    private listingService: ListingService,
    private hostelService: HostelService
  ) {}

  ngOnInit(): void {
    this.loadHostels();
    this.loadListings();
  }

  loadHostels(): void {
    this.hostelService.getAll().subscribe({
      next: (data: Hostel[]) => {
        this.hostels = data;
      },
      error: () => {
        // Silently fail hostel loading
      }
    });
  }

  loadListings(): void {
    this.listingService.getMine().subscribe({
      next: (data: Listing[]) => {
        this.listings = data;
        this.applyFilter();
      },
      error: () => {
        this.message = 'Không tải được danh sách bài đăng';
      }
    });
  }

  onHostelFilterChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedHostelId) {
      // Filter by hostel - need to check roomId belongs to hostel
      this.filteredListings = this.listings.filter(l => {
        // Simple filter for now
        return true; // TODO: implement proper filtering
      });
    } else {
      this.filteredListings = [...this.listings];
    }
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
