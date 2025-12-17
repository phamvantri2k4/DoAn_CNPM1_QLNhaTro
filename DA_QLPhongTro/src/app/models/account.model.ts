// account.model.ts
export type AccountRole = 'RENTER' | 'HOST' | 'ADMIN' | string;
export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'INACTIVE' | string;

export interface Account {
  accountId: number;       // maTK
  username: string;        // tenDangNhap (can be email)
  // password should never be sent from backend to frontend in production
  password?: string;       
  role: AccountRole;
  status: AccountStatus;
}
