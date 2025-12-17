namespace DA_QLPhongTro_Server.Models;

public class RentalInfo
{
    public int Id { get; set; }                // maThongTinThue
    public int RoomId { get; set; }            // maPhong
    public int RenterId { get; set; }          // maNguoiThue
    public int RequestId { get; set; }         // maYeuCau

    public DateTime StartDate { get; set; }    // ngayBatDau
    public DateTime? EndDate { get; set; }     // ngayKetThuc
    public decimal MonthlyPrice { get; set; }  // donGiaThue
    public decimal Deposit { get; set; }       // tienCoc
    public string Status { get; set; } = "Đang thuê"; // trangThaiThue

    // Navigation
    public Room Room { get; set; } = null!;
    public User Renter { get; set; } = null!;
    public RentalRequest Request { get; set; } = null!;
}
