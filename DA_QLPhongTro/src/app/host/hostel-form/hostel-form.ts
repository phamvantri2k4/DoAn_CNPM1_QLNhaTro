import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Hostel } from '../../models/hostel.model';
import { HostelService } from '../../services/hostel.service';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-host-hostel-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hostel-form.html',
  styleUrl: './hostel-form.css'
})
export class HostHostelFormComponent {
  form: Partial<Hostel> = {
    name: '',
    address: '',
    description: ''
  };
  isEdit = false;
  message = '';

  provinceOptions: string[] = [];
  districtOptions: string[] = [];
  wardOptions: string[] = [];

  provinceMode: 'select' = 'select';
  districtMode: 'select' = 'select';
  wardMode: 'select' = 'select';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hostelService: HostelService,
    private auth: AuthService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.hostelService.getById(Number(id)).subscribe({
        next: (res) => {
          this.form = res;
          this.loadLocationOptions();
          this.hydrateLocationForEdit();
        },
        error: () => (this.message = 'Không tải được trọ')
      });
    } else {
      this.loadLocationOptions();
    }
  }

  private hydrateLocationForEdit(): void {
    const province = this.normalize(this.form.province);
    const district = this.normalize(this.form.district);
    const ward = this.normalize(this.form.ward);

    if (!province) {
      this.districtOptions = [];
      this.wardOptions = [];
      return;
    }

    this.locationService.getDistricts(province).subscribe({
      next: (districts) => {
        this.districtOptions = districts || [];
        this.form.province = province;
        this.form.district = district;

        if (!district) {
          this.wardOptions = [];
          this.form.ward = '';
          return;
        }

        this.locationService.getWards(province, district).subscribe({
          next: (wards) => {
            this.wardOptions = wards || [];
            this.form.ward = ward;
          },
          error: () => {
            this.wardOptions = [];
          }
        });
      },
      error: () => {
        this.districtOptions = [];
        this.wardOptions = [];
      }
    });
  }

  private loadLocationOptions(): void {
    this.locationService.getProvinces().subscribe({
      next: (items) => {
        this.provinceOptions = items || [];
      },
      error: () => {
        this.provinceOptions = [];
      }
    });
  }

  private normalize(s: unknown): string {
    return String(s || '').trim();
  }

  onProvinceSelectChange(v: string): void {
    this.form.province = this.normalize(v);

    // reset cascade
    this.form.district = '';
    this.form.ward = '';

    const province = this.normalize(this.form.province);
    if (!province) {
      this.districtOptions = [];
      this.wardOptions = [];
      return;
    }

    this.locationService.getDistricts(province).subscribe({
      next: (items) => {
        this.districtOptions = items || [];
        this.wardOptions = [];
      },
      error: () => {
        this.districtOptions = [];
        this.wardOptions = [];
      }
    });
  }

  onDistrictSelectChange(v: string): void {
    this.form.district = this.normalize(v);
    this.form.ward = '';

    const province = this.normalize(this.form.province);
    const district = this.normalize(this.form.district);
    if (!province || !district) {
      this.wardOptions = [];
      return;
    }

    this.locationService.getWards(province, district).subscribe({
      next: (items) => {
        this.wardOptions = items || [];
      },
      error: () => {
        this.wardOptions = [];
      }
    });
  }

  onWardSelectChange(v: string): void {
    this.form.ward = this.normalize(v);
  }

  submit(): void {
    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) {
      this.message = 'Bạn cần đăng nhập';
      return;
    }
    this.form.ownerId = currentUserId;

    if (this.isEdit) {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) return;
      this.hostelService.update(Number(id), this.form).subscribe({
        next: () => {
          this.router.navigate(['/host/hostels']);
        },
        error: () => (this.message = 'Cập nhật thất bại')
      });
    } else {
      this.hostelService.create(this.form).subscribe({
        next: () => {
          this.router.navigate(['/host/hostels']);
        },
        error: () => (this.message = 'Tạo trọ thất bại')
      });
    }
  }
}
