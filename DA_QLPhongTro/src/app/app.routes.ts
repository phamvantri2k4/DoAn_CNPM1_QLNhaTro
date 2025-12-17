// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';

import { ListingDetailComponent } from './renter/listing-detail/listing-detail';
import { RoomDetailComponent } from './renter/room-detail/room-detail';
import { RentalHistoryComponent } from './renter/rental-history/rental-history';
import { ListingSearchComponent } from './renter/listing-search/listing-search';

import { HomeRedirectComponent } from './home-redirect/home-redirect';

import { HostRoomListComponent } from './host/room-list/room-list';
import { HostRoomFormComponent } from './host/room-form/room-form';
import { HostRentalRequestsComponent } from './host/rental-requests/rental-requests';
import { HostHostelListComponent } from './host/hostel-list/hostel-list';
import { HostHostelFormComponent } from './host/hostel-form/hostel-form';
import { HostListingListComponent } from './host/listing-list/listing-list';
import { HostListingFormComponent } from './host/listing-form/listing-form';

import { ProfileComponent } from './profile/profile';

import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard';
import { AdminListingsComponent } from './admin/listings/admin-listings';
import { AdminUsersComponent } from './admin/users/admin-users';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Auth (không cần layout)
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'home', component: HomeRedirectComponent },
      { path: 'listings', component: ListingSearchComponent },
      { path: 'listings/:id', component: ListingDetailComponent },
      { path: 'rooms/:id', component: RoomDetailComponent },
      { path: 'renter/listings', component: ListingSearchComponent },
      { path: 'renter/rental-history', component: RentalHistoryComponent },

      // Profile
      { path: 'profile', component: ProfileComponent },

      // Host
      { path: 'host/hostels', component: HostHostelListComponent },
      { path: 'host/hostels/create', component: HostHostelFormComponent },
      { path: 'host/hostels/:id/edit', component: HostHostelFormComponent },

      { path: 'host/rooms', component: HostRoomListComponent },
      { path: 'host/rooms/create', component: HostRoomFormComponent },
      { path: 'host/rooms/:id/edit', component: HostRoomFormComponent },

      { path: 'host/listings', component: HostListingListComponent },
      { path: 'host/listings/create', component: HostListingFormComponent },
      { path: 'host/listings/:id/edit', component: HostListingFormComponent },
      
      { path: 'host/rental-requests', component: HostRentalRequestsComponent },

      // Admin
      { path: 'admin/dashboard', component: AdminDashboardComponent },
      { path: 'admin/users', component: AdminUsersComponent },
      { path: 'admin/listings', component: AdminListingsComponent },
      { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'home' }
];
