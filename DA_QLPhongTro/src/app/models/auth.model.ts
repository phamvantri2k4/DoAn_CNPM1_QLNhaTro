// auth.model.ts
import { User } from './user.model';

export interface LoginPayload {
  usernameOrEmail: string; // Khớp với backend: UsernameOrEmail
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: string; // renter, owner
}

export interface AuthResponse {
  success: boolean;
  token?: string; // Backend trả về Token, không phải accessToken
  user?: UserDto; // Backend trả về User, không phải account
  message?: string;
}

export interface UserDto {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  address?: string;
  role: string;
  status: string;
}
