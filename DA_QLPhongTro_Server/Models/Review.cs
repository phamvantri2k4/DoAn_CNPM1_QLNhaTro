namespace DA_QLPhongTro_Server.Models;

public class Review
{
    public int Id { get; set; }               // maDanhGia
    public int RoomId { get; set; }           // maPhong
    public int RenterId { get; set; }         // maNguoiThue

    public int Rating { get; set; }           // diemDanhGia
    public string? Comment { get; set; }      // noiDungBinhLuan
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // ngayDanhGia

    // Navigation
    public Room Room { get; set; } = null!;
    public User Renter { get; set; } = null!;
}
