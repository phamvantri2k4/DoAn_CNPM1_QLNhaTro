using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HostelsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public HostelsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public class HostelCreateUpdateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public string? Description { get; set; }
    }

    public class HostelDto
    {
        public int HostelId { get; set; }
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public string? Description { get; set; }
        public int RoomCount { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HostelDto>>> GetAll([FromQuery] int? ownerId)
    {
        var query = _db.Hostels.AsQueryable();

        // Nếu là chủ trọ, luôn lọc theo OwnerId trong token để chỉ thấy trọ của chính mình
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (User.IsInRole("owner") && int.TryParse(userIdClaim, out var ownerIdFromToken))
        {
            query = query.Where(h => h.OwnerId == ownerIdFromToken);
        }
        else if (ownerId.HasValue)
        {
            // Cho phép admin/role khác lọc theo ownerId nếu cần
            query = query.Where(h => h.OwnerId == ownerId.Value);
        }

        var data = await query
            .AsNoTracking()
            .Select(h => new HostelDto
            {
                HostelId = h.Id,
                OwnerId = h.OwnerId,
                Name = h.Name,
                Address = h.Address,
                Province = h.Province,
                District = h.District,
                Ward = h.Ward,
                Description = h.Description,
                RoomCount = _db.Rooms.Count(r => r.HostelId == h.Id),
                Status = h.Status
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HostelDto>> GetById(int id)
    {
        var dto = await _db.Hostels
            .AsNoTracking()
            .Where(h => h.Id == id)
            .Select(h => new HostelDto
            {
                HostelId = h.Id,
                OwnerId = h.OwnerId,
                Name = h.Name,
                Address = h.Address,
                Province = h.Province,
                District = h.District,
                Ward = h.Ward,
                Description = h.Description,
                RoomCount = _db.Rooms.Count(r => r.HostelId == h.Id),
                Status = h.Status
            })
            .FirstOrDefaultAsync();

        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "owner")]
    public async Task<ActionResult<HostelDto>> Create([FromBody] HostelCreateUpdateRequest body)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var ownerId)) return Unauthorized();

        var hostel = new Hostel
        {
            OwnerId = ownerId,
            Name = body.Name,
            Address = body.Address,
            Province = body.Province,
            District = body.District,
            Ward = body.Ward,
            Description = body.Description,
            RoomCount = 0,
            Status = "Hoạt động"
        };

        _db.Hostels.Add(hostel);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = hostel.Id }, new HostelDto
        {
            HostelId = hostel.Id,
            OwnerId = hostel.OwnerId,
            Name = hostel.Name,
            Address = hostel.Address,
            Province = hostel.Province,
            District = hostel.District,
            Ward = hostel.Ward,
            Description = hostel.Description,
            RoomCount = 0,
            Status = hostel.Status
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Update(int id, [FromBody] HostelCreateUpdateRequest update)
    {
        var hostel = await _db.Hostels.FindAsync(id);
        if (hostel == null) return NotFound();

        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var ownerId)) return Unauthorized();
        if (hostel.OwnerId != ownerId) return Forbid();

        hostel.Name = update.Name;
        hostel.Address = update.Address;
        hostel.Province = update.Province;
        hostel.District = update.District;
        hostel.Ward = update.Ward;
        hostel.Description = update.Description;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Delete(int id)
    {
        var hostel = await _db.Hostels.FindAsync(id);
        if (hostel == null) return NotFound();

        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var ownerId)) return Unauthorized();
        if (hostel.OwnerId != ownerId) return Forbid();

        // Kiểm tra xem có phòng nào đang được thuê không (Status = "Đang thuê")
        var hasActiveRentals = await _db.RentalInfos
            .AsNoTracking()
            .AnyAsync(ri => ri.Room != null && ri.Room.HostelId == id && ri.Status == "Đang thuê");

        if (hasActiveRentals)
        {
            return BadRequest(new { message = "Không thể xóa trọ vì có phòng đang được thuê. Vui lòng chờ người thuê trả phòng trước." });
        }

        // Kiểm tra xem có yêu cầu thuê đang chờ không
        var hasPendingRequests = await _db.RentalRequests
            .AsNoTracking()
            .AnyAsync(rr => rr.Room != null && rr.Room.HostelId == id && rr.Status == "PENDING");

        if (hasPendingRequests)
        {
            return BadRequest(new { message = "Không thể xóa trọ vì có yêu cầu thuê phòng đang chờ xử lý. Vui lòng xử lý hết yêu cầu trước." });
        }

        // Lấy danh sách phòng của trọ
        var rooms = await _db.Rooms.Where(r => r.HostelId == id).ToListAsync();
        var roomIds = rooms.Select(r => r.Id).ToList();

        // Xóa tất cả bài đăng của các phòng
        var posts = await _db.Posts.Where(p => roomIds.Contains(p.RoomId)).ToListAsync();
        _db.Posts.RemoveRange(posts);

        // Xóa tất cả yêu cầu thuê (REJECTED, CANCELLED) của các phòng
        var rentalRequests = await _db.RentalRequests
            .Where(rr => roomIds.Contains(rr.RoomId) && rr.Status != "PENDING")
            .ToListAsync();
        _db.RentalRequests.RemoveRange(rentalRequests);

        // Xóa tất cả thông tin thuê cũ (đã trả phòng) của các phòng
        var oldRentalInfos = await _db.RentalInfos
            .Where(ri => roomIds.Contains(ri.RoomId) && ri.Status != "Đang thuê")
            .ToListAsync();
        _db.RentalInfos.RemoveRange(oldRentalInfos);

        // Xóa tất cả đánh giá của các phòng
        var reviews = await _db.Reviews.Where(rv => roomIds.Contains(rv.RoomId)).ToListAsync();
        _db.Reviews.RemoveRange(reviews);

        // Xóa tất cả phòng
        _db.Rooms.RemoveRange(rooms);

        // Xóa trọ
        _db.Hostels.Remove(hostel);

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
