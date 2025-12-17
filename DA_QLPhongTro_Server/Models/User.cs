namespace DA_QLPhongTro_Server.Models;

public class User
{
    public int Id { get; set; }                 // maNguoiDung
    public string FullName { get; set; } = string.Empty; // hoTen
    public string? Phone { get; set; }          // soDienThoai
    public string Email { get; set; } = string.Empty;    // email
    public string? AvatarUrl { get; set; }      // anhDaiDien
    public string? Address { get; set; }        // diaChi

    // FK to Account (TaiKhoan)
    public int AccountId { get; set; }
    public Account Account { get; set; } = null!;

    // Navigation collections
    public ICollection<Room> Rooms { get; set; } = new List<Room>();            // as Owner (Chu tro)
    public ICollection<RentalRequest> RentalRequests { get; set; } = new List<RentalRequest>();
    public ICollection<RentalInfo> RentalInfos { get; set; } = new List<RentalInfo>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
