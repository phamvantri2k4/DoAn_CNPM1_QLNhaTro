import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingService } from '../../services/listing.service';
import { HostelService } from '../../services/hostel.service';
import { Listing } from '../../models/listing.model';
import { Hostel } from '../../models/hostel.model';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../components/dialog/dialog.service';

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
    private hostelService: HostelService,
    private auth: AuthService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.loadHostels();
    this.loadListings();
  }

  loadHostels(): void {
    const ownerId = this.auth.getCurrentUserId();
    if (!ownerId) {
      this.hostels = [];
      return;
    }

    this.hostelService.getAll(ownerId).subscribe({
      next: (data: Hostel[]) => {
        this.hostels = data || [];
      },
      error: () => {
        this.hostels = [];
      }
    });
  }

  loadListings(): void {
    this.listingService.getMine().subscribe({
      next: (data: Listing[]) => {
        this.listings = data || [];
        this.applyFilter();
      },
      error: () => {
        this.message = 'Không tải được danh sách bài đăng';
        this.listings = [];
        this.filteredListings = [];
      }
    });
  }

  onHostelFilterChange(): void {
    console.log('Filter changed, selectedHostelId:', this.selectedHostelId);
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedHostelId) {
      // Convert to number for safe comparison
      const targetHostelId = Number(this.selectedHostelId);
      this.filteredListings = this.listings.filter(l => {
        const listingHostelId = l.hostelId ? Number(l.hostelId) : null;
        return listingHostelId === targetHostelId;
      });
      console.log('Filtered to hostel', targetHostelId, ':', this.filteredListings.length, 'results');
    } else {
      this.filteredListings = [...this.listings];
      console.log('Showing all listings:', this.filteredListings.length);
    }
  }

  getFirstImage(listing: Listing): string | null {
    return this.listingService.getFirstImage(listing);
  }

  getImageCount(listing: Listing): number {
    return listing.images?.length || 0;
  }

  deletePost(id: number): void {
    this.dialog.confirm('Bạn có chắc muốn xóa bài đăng này?', {
      title: 'Xác nhận xóa',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      onConfirm: () => {
        this.listingService.delete(id).subscribe({
          next: () => {
            this.loadListings();
            this.dialog.success('Đã xóa bài đăng');
          },
          error: () => {
            this.dialog.error('Xóa thất bại');
          }
        });
      }
    });
  }

  toggleStatus(id: number, currentStatus: string): void {
    const newStatus = currentStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    this.listingService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.message = `Đã ${newStatus === 'VISIBLE' ? 'hiển thị' : 'ẩn'} bài đăng`;
        this.loadListings();
        setTimeout(() => this.message = '', 3000);
      },
      error: () => {
        this.message = 'Cập nhật trạng thái thất bại';
        setTimeout(() => this.message = '', 3000);
      }
    });
  }
}
