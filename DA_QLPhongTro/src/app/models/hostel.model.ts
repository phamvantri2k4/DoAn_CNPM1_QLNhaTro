// hostel.model.ts
export interface Hostel {
  id?: number;
  hostelId?: number;   // maTro
  ownerId?: number;   // maChuTro
  name: string;       // tenTro
  address?: string;   // diaChi
  province?: string;
  district?: string;
  ward?: string;
  description?: string; // moTa
  roomCount?: number; // soLuongPhong
  status?: 'ACTIVE'|'INACTIVE'|string; // trangThaiTro
}
