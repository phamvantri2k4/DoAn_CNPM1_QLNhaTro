// rental-request.model.ts
export type RequestType = 'RENT' | 'RETURN' | string;
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | string;

export interface RentalRequest {
  id?: number;         // backend Id
  requestId: number;   // maYeuCau
  roomId: number;      // maPhong
  renterId?: number;   // maNguoiThue (User.userId)
  sentAt?: string;     // ngayGui (ISO string)
  sentDate?: string;   // backend field
  note?: string;       // ghiChu
  requestType: RequestType;    // loaiYeuCau
  status?: RequestStatus;      // trangThaiYeuCau

  roomTitle?: string;
  hostelName?: string;
}
