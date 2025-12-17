namespace DA_QLPhongTro_Server.Models;

public class Post
{
    public int Id { get; set; }                  // maTinDang
    public int RoomId { get; set; }              // maPhong

    public string Title { get; set; } = string.Empty;      // tieuDe
    public string? Description { get; set; }     // noiDungMoTa
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // ngayDang
    public string Status { get; set; } = "VISIBLE";      // trangThaiTin
    public string? ImagesJson { get; set; }       // anhTinDang (JSON string[])

    // Navigation
    public Room Room { get; set; } = null!;
}
