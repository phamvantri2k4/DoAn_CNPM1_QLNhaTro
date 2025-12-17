import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUserService } from '../../services/admin-user.service';
import { ListingService } from '../../services/listing.service';
import { User } from '../../models/user.model';
import { Listing } from '../../models/listing.model';

@Component({
  selector: 'app-admin-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-listings.html',
  styleUrl: './admin-listings.css'
})
export class AdminListingsComponent {
  users: User[] = [];
  selectedUserId: number | null = null;

  listings: Listing[] = [];
  loadingUsers = false;
  loadingListings = false;
  message = '';

  constructor(private adminUserService: AdminUserService, private listingService: ListingService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  private normalizeRole(role: string | undefined | null): string {
    const r = String(role || '').toLowerCase();
    if (r === 'owner' || r === 'host') return 'owner';
    if (r === 'admin') return 'admin';
    if (r === 'renter' || r === 'tenant') return 'renter';
    return r;
  }

  get ownerUsers(): User[] {
    return (this.users || []).filter((u) => this.normalizeRole(u.role || u.account?.role) === 'owner');
  }

  fetchUsers(): void {
    this.loadingUsers = true;
    this.message = '';
    this.adminUserService.getAll().subscribe({
      next: (users) => {
        this.users = users || [];
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
        this.message = 'Không tải được danh sách người dùng';
      }
    });
  }

  onSelectUser(): void {
    if (!this.selectedUserId) {
      this.listings = [];
      return;
    }
    this.fetchListingsForUser(this.selectedUserId);
  }

  fetchListingsForUser(userId: number): void {
    this.loadingListings = true;
    this.message = '';
    this.listingService.getByHost(userId).subscribe({
      next: (items) => {
        this.listings = items || [];
        this.loadingListings = false;
      },
      error: () => {
        this.loadingListings = false;
        this.message = 'Không tải được bài viết của người dùng';
      }
    });
  }

  getFirstImage(listing: Listing): string | null {
    return this.listingService.getFirstImage(listing);
  }

  deleteListing(listing: Listing): void {
    const id = listing.id;
    if (!id) return;
    if (!confirm('Xóa bài viết này?')) return;

    this.listingService.delete(Number(id)).subscribe({
      next: () => {
        if (this.selectedUserId) this.fetchListingsForUser(this.selectedUserId);
      },
      error: () => {
        this.message = 'Xóa bài viết thất bại';
      }
    });
  }
}
