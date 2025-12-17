// room.model.ts
export interface Room {
  id?: number;              // MaPhong (backend)
  roomId?: number;          // alias when mapping
  ownerId?: number;         // MaChuTro
  hostelId?: number | null; // MaTro (Tro/Hostel)
  title: string;            // TieuDe
  area?: number;            // DienTich
  price?: number;           // GiaThue
  deposit?: number;         // TienCoc
  utilitiesDescription?: string; // MoTaTienIch
  status?: string;          // TrangThaiPhong
  images?: string[];        // JSON array string[]
  imagesJson?: string;      // backend ImagesJson column
}
