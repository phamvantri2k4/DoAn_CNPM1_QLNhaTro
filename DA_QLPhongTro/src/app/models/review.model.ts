// review.model.ts
export interface Review {
  id?: number;          // MaDanhGia (backend Id)
  reviewId?: number;    // alias if needed
  roomId: number;       // MaPhong
  renterId?: number;    // MaNguoiThue
  renterFullName?: string; // Ten nguoi danh gia
  rating: number;       // diemDanhGia (1..5)
  comment?: string;     // noiDungBinhLuan
  reviewedAt?: string;  // ngayDanhGia (ISO string)
  createdAt?: string;   // backend field
}
