// rental-info.model.ts
// Khớp với backend: Id, RoomId, RenterId, RequestId, StartDate, EndDate, MonthlyPrice, Deposit, Status
// JSON serialization sẽ chuyển thành camelCase: id, roomId, renterId, requestId, startDate, endDate, monthlyPrice, deposit, status
export type RentalStatus = 'Đang thuê' | 'Đã kết thúc' | 'Đã hủy' | string;

import { Room } from './room.model';
import { User } from './user.model';
import { RentalRequest } from './rental-request.model';

export interface RentalInfo {
  id: number;              // MaThongTinThue (backend: Id)
  roomId: number;           // MaPhong
  renterId: number;         // MaNguoiThue
  requestId: number;         // MaYeuCau (backend không nullable, nhưng có thể là 0)
  startDate: string;        // NgayBatDau (ISO string)
  endDate?: string | null;  // NgayKetThuc (ISO string, nullable)
  monthlyPrice: number;     // DonGiaThue (backend: MonthlyPrice)
  deposit: number;          // TienCoc
  status: string;           // TrangThaiThue: "Đang thuê", "Đã kết thúc", "Đã hủy"
  
  // Navigation properties (có thể có khi include)
  room?: Room;
  renter?: User;
  request?: RentalRequest;
}
