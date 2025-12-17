namespace DA_QLPhongTro_Server.Models;

public class Hostel
{
    public int Id { get; set; }                     // maTro
    public int OwnerId { get; set; }               // maChuTro (NguoiDung)

    public string Name { get; set; } = string.Empty;        // tenTro
    public string? Address { get; set; }            // diaChi
    public string? Province { get; set; }
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? Description { get; set; }        // moTa
    public int RoomCount { get; set; }              // soLuongPhong (sync từ Rooms.Count)
    public string Status { get; set; } = "Hoạt động"; // trangThaiTro

    // Computed property for accurate room count
    public int ActualRoomCount => Rooms?.Count ?? 0;

    // Navigation
    public User Owner { get; set; } = null!;
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
