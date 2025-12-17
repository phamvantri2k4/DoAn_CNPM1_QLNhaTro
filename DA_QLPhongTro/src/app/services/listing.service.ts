import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from './http-service';
import { Listing, ListingStatus } from '../models/listing.model';

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  constructor(private api: HttpService) {}

  getAll(): Observable<Listing[]> {
    return this.api.getListings().pipe(map((items) => (items || []).map((x) => this.normalize(x))));
  }

  getMine(): Observable<Listing[]> {
    return this.api.getMyListings().pipe(map((items) => (items || []).map((x) => this.normalize(x))));
  }

  getById(id: number): Observable<Listing> {
    return this.api.getListingById(id).pipe(map((x) => this.normalize(x)));
  }

  create(body: Partial<Listing>): Observable<Listing> {
    // Gửi đúng các trường backend cần, không cần phức tạp
    const payload: Partial<Listing> = {
      roomId: body.roomId!,
      title: body.title ?? '',
      // Listing định nghĩa description?: string nên dùng undefined thay vì null
      description: body.description ?? undefined,
      status: body.status ?? 'VISIBLE',
      // imagesJson?: string | null - có thể để undefined khi không có ảnh
      imagesJson: body.imagesJson ?? undefined
    };

    return this.api.createListing(payload);
  }

  update(id: number, body: Partial<Listing>): Observable<void> {
    return this.api.updateListing(id, body);
  }

  delete(id: number): Observable<void> {
    return this.api.deleteListing(id);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.api.updateListingStatus(id, status);
  }

  getByHost(hostId: number): Observable<Listing[]> {
    return this.api.getPostsByHost(hostId).pipe(map((items) => (items || []).map((x) => this.normalize(x))));
  }

  getFirstImage(listing: Listing): string | null {
    const url = listing.images && listing.images.length > 0 ? listing.images[0] : null;
    if (!url) return null;

    const s = String(url).trim();
    if (!s) return null;

    if (
      s.startsWith('http://') ||
      s.startsWith('https://') ||
      s.startsWith('data:image/')
    ) {
      return s;
    }

    if (s.startsWith('/')) {
      return `${this.api.getApiOrigin()}${s}`;
    }

    return null;
  }

  private normalize(raw: unknown): Listing {
    const x = (raw ?? {}) as Record<string, unknown>;

    const get = (key: string, altKey?: string): unknown => {
      if (key in x) return x[key];
      if (altKey && altKey in x) return x[altKey];
      return undefined;
    };

    const firstImage = get('firstImage', 'FirstImage');

    const imagesJsonRaw = get('imagesJson', 'ImagesJson');
    const imagesJson = typeof imagesJsonRaw === 'string' ? imagesJsonRaw : (imagesJsonRaw == null ? null : String(imagesJsonRaw));
    const imagesFromJson = this.parseImages(imagesJson);
    const images = imagesFromJson.length
      ? imagesFromJson
      : (firstImage ? [String(firstImage)] : undefined);

    return {
      id: Number(get('id', 'Id') ?? 0),
      roomId: Number(get('roomId', 'RoomId') ?? 0),
      title: String(get('title', 'Title') ?? ''),
      description: get('description', 'Description') as string | undefined,
      createdAt: get('createdAt', 'CreatedAt') as string | undefined,
      status: (get('status', 'Status') as ListingStatus | undefined) ?? undefined,
      price: get('price', 'Price') as number | undefined,
      area: get('area', 'Area') as number | undefined,
      address: get('address', 'Address') as string | undefined,
      province: get('province', 'Province') as string | undefined,
      district: get('district', 'District') as string | undefined,
      ward: get('ward', 'Ward') as string | undefined,
      ownerFullName: get('ownerFullName', 'OwnerFullName') as string | undefined,
      ownerPhone: get('ownerPhone', 'OwnerPhone') as string | undefined,
      ownerEmail: get('ownerEmail', 'OwnerEmail') as string | undefined,
      images,
      imagesJson: imagesJson ?? undefined
    };
  }

  private parseImages(imagesJson: string | null | undefined): string[] {
    if (!imagesJson) return [];

    const raw = String(imagesJson).trim();
    if (!raw) return [];

    const toAbsolute = (url: string): string | null => {
      const s = String(url || '').trim();
      if (!s) return null;
      if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/')) return s;
      if (s.startsWith('/')) return `${this.api.getApiOrigin()}${s}`;
      return null;
    };

    // JSON array
    if (raw.startsWith('[')) {
      try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.map(toAbsolute).filter((x): x is string => !!x);
      } catch {
        return [];
      }
    }

    // single string
    const one = toAbsolute(raw);
    return one ? [one] : [];
  }
}
