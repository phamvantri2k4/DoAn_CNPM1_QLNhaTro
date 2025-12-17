// current-rental-info.model.ts
// DTO for current rental information returned by the API
export interface CurrentRentalInfo {
  renterFullName?: string;
  renterPhone?: string;
  renterEmail?: string;
  startDate?: string;
  endDate?: string | null;
  monthlyPrice?: number;
  deposit?: number;
}
