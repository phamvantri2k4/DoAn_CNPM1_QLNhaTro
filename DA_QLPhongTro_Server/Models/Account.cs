namespace DA_QLPhongTro_Server.Models;

public class Account
{
    public int Id { get; set; }           // maTK
    public string Username { get; set; } = string.Empty; // tenDangNhap (email or username)
    public string PasswordHash { get; set; } = string.Empty; // matKhau (hashed)
    public string Role { get; set; } = "renter";          // vaiTro: renter/owner/admin
    public string Status { get; set; } = "ACTIVE";        // trangThaiTaiKhoan

    // Navigation
    public User? User { get; set; }
}
