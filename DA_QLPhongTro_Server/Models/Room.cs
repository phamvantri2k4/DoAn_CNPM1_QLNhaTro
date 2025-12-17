namespace DA_QLPhongTro_Server.Models;

public class Room
{
    public int Id { get; set; }                    // maPhong
    public int OwnerId { get; set; }              // maChuTro (NguoiDung)
    public int? HostelId { get; set; }            // maTro (Tro) - optional để tương thích

    public string Title { get; set; } = string.Empty;      // tieuDe
    public double? Area { get; set; }             // dienTich
    public decimal Price { get; set; }            // giaThue
    public decimal Deposit { get; set; }          // tienCoc
    public string? UtilitiesDescription { get; set; } // moTaTienIch
    public string Status { get; set; } = "Còn trống";    // trangThaiPhong

    // Navigation
    public User Owner { get; set; } = null!;
    public Hostel? Hostel { get; set; }
    public ICollection<Post> Posts { get; set; } = new List<Post>();
    public ICollection<RentalRequest> RentalRequests { get; set; } = new List<RentalRequest>();
    public ICollection<RentalInfo> RentalInfos { get; set; } = new List<RentalInfo>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
