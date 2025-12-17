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

}
