// user.model.ts
import { Account } from './account.model';

export interface User {
  id?: number;            // backend Id
  userId: number;         // maNguoiDung
  fullName: string;       // hoTen
  phone?: string;         // soDienThoai
  email: string;          // email
  avatarUrl?: string;     // anhDaiDien
  address?: string;       // diaChi
  role?: string;          // VaiTro (from Account)
  status?: string;        // TrangThaiTaiKhoan (from Account)
  accountId?: number;     // maTK (FK)
  account?: Account;      // optional nested account info
}
