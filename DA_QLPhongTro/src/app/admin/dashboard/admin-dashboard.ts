import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminUserService } from '../../services/admin-user.service';
import { ListingService } from '../../services/listing.service';
import { User } from '../../models/user.model';
import { Listing } from '../../models/listing.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent {
  users: User[] = [];
  listings: Listing[] = [];
  loading = false;
  message = '';

  constructor(private adminUserService: AdminUserService, private listingService: ListingService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.message = '';

    this.adminUserService.getAll().subscribe({
      next: (users) => {
        this.users = users || [];

        this.listingService.getAll().subscribe({
          next: (listings) => {
            this.listings = listings || [];
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.message = 'Không tải được danh sách bài viết';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.message = 'Không tải được danh sách người dùng';
      }
    });
  }

  private normalizeUserRole(role: string | undefined | null): string {
    const r = String(role || '').toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'owner' || r === 'host') return 'owner';
    if (r === 'renter' || r === 'tenant') return 'renter';
    return r || 'unknown';
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get adminCount(): number {
    return this.users.filter((u) => this.normalizeUserRole(u.role || u.account?.role) === 'admin').length;
  }

  get ownerCount(): number {
    return this.users.filter((u) => this.normalizeUserRole(u.role || u.account?.role) === 'owner').length;
  }

  get renterCount(): number {
    return this.users.filter((u) => this.normalizeUserRole(u.role || u.account?.role) === 'renter').length;
  }

  get totalListings(): number {
    return this.listings.length;
  }

  get listingsWithImages(): number {
    return (this.listings || []).filter((x) => (x.images || []).length > 0).length;
  }

  get listingsWithoutImages(): number {
    return (this.listings || []).filter((x) => !(x.images || []).length).length;
  }
}
