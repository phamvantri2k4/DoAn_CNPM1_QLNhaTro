namespace DA_QLPhongTro_Server.Models;

public class RentalRequest
{
    public int Id { get; set; }                 // maYeuCau
    public int RoomId { get; set; }             // maPhong
    public int RenterId { get; set; }           // maNguoiThue

    public DateTime SentDate { get; set; } = DateTime.UtcNow; // ngayGui
    public string? Note { get; set; }           // ghiChu
    public string RequestType { get; set; } = "RENT";   // loaiYeuCau: RENT/RETURN
    public string Status { get; set; } = "PENDING";    // trangThaiYeuCau

    // Navigation
    public Room Room { get; set; } = null!;
    public User Renter { get; set; } = null!;
    public RentalInfo? RentalInfo { get; set; }  // 1 - 0..1 với ThongTinThue
}
