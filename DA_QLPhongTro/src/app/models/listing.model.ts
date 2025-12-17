// listing.model.ts
export type ListingStatus = 'VISIBLE' | 'HIDDEN' | 'EXPIRED' | string;

export interface Listing {
  id: number;              // MaTinDang (backend Id)
  roomId: number;          // MaPhong
  title: string;           // TieuDe
  description?: string;    // NoiDungMoTa
  createdAt?: string;      // NgayDang
  status?: ListingStatus;  // TrangThaiTin
  images?: string[];       // parsed from imagesJson
  imagesJson?: string | null;     // backend ImagesJson column
  // Optional fields for richer UI (may or may not be provided by backend)
  price?: number;          // DonGia or tong tien / thang
  address?: string;        // DiaChi phong / tro
  province?: string;
  district?: string;
  ward?: string;
  area?: number;           // DienTich (m2)
  rating?: number;         // Diem danh gia trung binh
  ratingCount?: number;    // So luot danh gia
  isNew?: boolean;         // Danh dau tin moi

  ownerFullName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}
