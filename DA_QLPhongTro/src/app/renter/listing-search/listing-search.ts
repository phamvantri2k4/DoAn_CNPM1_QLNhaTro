import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Listing } from '../../models/listing.model';
import { ListingService } from '../../services/listing.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-listing-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './listing-search.html',
  styleUrl: './listing-search.css'
})
export class ListingSearchComponent {
  listings: Listing[] = [];
  searchTerm = '';
  loading = false;
  error = '';

  showFilters = false;

  selectedProvince = '';
  selectedDistrict = '';
  selectedWard = '';

  provinceOptions: string[] = [];
  districtOptions: string[] = [];
  wardOptions: string[] = [];

  selectedPriceRange = 'ALL';
  selectedAreaRange = 'ALL';

  constructor(private listingService: ListingService, private locationService: LocationService) {}

  ngOnInit(): void {
    this.fetch();
    this.loadProvinces();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  private loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: (items) => {
        this.provinceOptions = items || [];
      },
      error: () => {
        this.provinceOptions = [];
      }
    });
  }

  fetch(): void {
    this.loading = true;
    this.listingService.getAll().subscribe({
      next: (data) => {
        this.listings = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Không tải được danh sách tin';
      }
    });
  }

  get filteredListings(): Listing[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    const hasKeyword = !!keyword;

    const provinceKey = this.locationKey(this.selectedProvince, 'province');
    const districtKey = this.locationKey(this.selectedDistrict, 'district');
    const wardKey = this.locationKey(this.selectedWard, 'ward');

    const pr = this.priceRanges.find((x) => x.key === this.selectedPriceRange) || this.priceRanges[0];
    const ar = this.areaRanges.find((x) => x.key === this.selectedAreaRange) || this.areaRanges[0];

    return (this.listings || []).filter((item) => {
      if (hasKeyword) {
        const title = item.title?.toLowerCase() || '';
        const desc = item.description?.toLowerCase() || '';
        const address = (item.address || '').toLowerCase();
        const matchText = title.includes(keyword) || desc.includes(keyword) || address.includes(keyword);
        if (!matchText) return false;
      }

      const loc = this.getLocation(item);

      if (provinceKey && this.locationKey(loc.province, 'province') !== provinceKey) return false;
      if (districtKey && this.locationKey(loc.district, 'district') !== districtKey) return false;
      if (wardKey && this.locationKey(loc.ward, 'ward') !== wardKey) return false;

      const price = Number(item.price ?? 0) || 0;
      if (pr.min !== undefined && price < pr.min) return false;
      if (pr.max !== undefined && price > pr.max) return false;

      const areaVal = Number(item.area ?? 0) || 0;
      if (ar.min !== undefined && areaVal < ar.min) return false;
      if (ar.max !== undefined && areaVal > ar.max) return false;

      return true;
    });
  }

  onProvinceChange(): void {
    this.selectedDistrict = '';
    this.selectedWard = '';

    this.districtOptions = [];
    this.wardOptions = [];
    if (!this.selectedProvince) return;

    this.locationService.getDistricts(this.selectedProvince).subscribe({
      next: (items) => {
        this.districtOptions = items || [];
      },
      error: () => {
        this.districtOptions = [];
      }
    });
  }

  onDistrictChange(): void {
    this.selectedWard = '';

    this.wardOptions = [];
    if (!this.selectedProvince || !this.selectedDistrict) return;

    this.locationService.getWards(this.selectedProvince, this.selectedDistrict).subscribe({
      next: (items) => {
        this.wardOptions = items || [];
      },
      error: () => {
        this.wardOptions = [];
      }
    });
  }

  priceRanges: Array<{ key: string; label: string; min?: number; max?: number }> = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'LT_1M', label: 'Dưới 1 triệu', max: 1_000_000 },
    { key: '1_2M', label: '1 - 2 triệu', min: 1_000_000, max: 2_000_000 },
    { key: '2_3M', label: '2 - 3 triệu', min: 2_000_000, max: 3_000_000 },
    { key: '3_5M', label: '3 - 5 triệu', min: 3_000_000, max: 5_000_000 },
    { key: '5_7M', label: '5 - 7 triệu', min: 5_000_000, max: 7_000_000 },
    { key: '7_10M', label: '7 - 10 triệu', min: 7_000_000, max: 10_000_000 },
    { key: '10_15M', label: '10 - 15 triệu', min: 10_000_000, max: 15_000_000 },
    { key: 'GT_15M', label: 'Trên 15 triệu', min: 15_000_000 }
  ];

  areaRanges: Array<{ key: string; label: string; min?: number; max?: number }> = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'LT_20', label: 'Dưới 20m²', max: 20 },
    { key: '20_30', label: '20 - 30m²', min: 20, max: 30 },
    { key: '30_50', label: '30 - 50m²', min: 30, max: 50 },
    { key: '50_70', label: '50 - 70m²', min: 50, max: 70 },
    { key: '70_90', label: '70 - 90m²', min: 70, max: 90 },
    { key: 'GT_90', label: 'Trên 90m²', min: 90 }
  ];

  selectPriceRange(key: string): void {
    this.selectedPriceRange = key;
  }

  selectAreaRange(key: string): void {
    this.selectedAreaRange = key;
  }

  private stripAccents(input: string): string {
    const s = String(input || '').trim();
    if (!s) return '';
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  private locationKey(value: string, type: 'province' | 'district' | 'ward'): string {
    let s = this.stripAccents(value).toLowerCase().trim();
    if (!s) return '';

    s = s.replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();

    if (type === 'province') {
      s = s
        .replace(/^tinh\s+/i, '')
        .replace(/^thanh pho\s+/i, '')
        .replace(/^tp\s+/i, '');
    }

    if (type === 'district') {
      s = s
        .replace(/^quan\s+/i, '')
        .replace(/^huyen\s+/i, '')
        .replace(/^thi xa\s+/i, '')
        .replace(/^thanh pho\s+/i, '');
    }

    if (type === 'ward') {
      s = s
        .replace(/^phuong\s+/i, '')
        .replace(/^xa\s+/i, '')
        .replace(/^thi tran\s+/i, '');
    }

    return s;
  }

  private getLocation(item: Listing): { province: string; district: string; ward: string } {
    const raw = item as unknown as Record<string, unknown>;

    const toText = (v: unknown): string => String(v ?? '').trim();
    const directProvince = toText(item.province ?? raw['Province']);
    const directDistrict = toText(item.district ?? raw['District']);
    const directWard = toText(item.ward ?? raw['Ward']);

    if (directProvince || directDistrict || directWard) {
      return { province: directProvince, district: directDistrict, ward: directWard };
    }

    const addressText = toText(item.address ?? raw['Address']);
    const parts = addressText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    let province = '';
    let district = '';
    let ward = '';

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const pl = p.toLowerCase();
      if (pl.includes('việt nam') || pl === 'vn') continue;

      if (!province && (pl.startsWith('tỉnh ') || pl.startsWith('thành phố ') || pl.startsWith('tp'))) {
        province = p;
        continue;
      }
      if (!district && (pl.startsWith('quận') || pl.startsWith('q.') || pl.startsWith('q ') || pl.startsWith('huyện') || pl.startsWith('h.') || pl.startsWith('h '))) {
        district = p;
        continue;
      }
      if (!ward && (pl.startsWith('phường') || pl.startsWith('p.') || pl.startsWith('p ') || pl.startsWith('xã') || pl.startsWith('thị trấn'))) {
        ward = p;
        continue;
      }
      if (!province && i === parts.length - 1) province = p;
    }

    return { province, district, ward };
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedProvince = '';
    this.selectedDistrict = '';
    this.selectedWard = '';
    this.selectedPriceRange = 'ALL';
    this.selectedAreaRange = 'ALL';
    this.districtOptions = [];
    this.wardOptions = [];
  }

  /**
   * Get first image efficiently for thumbnail display
   */
  getFirstImage(listing: Listing): string | null {
    return this.listingService.getFirstImage(listing);
  }
}

