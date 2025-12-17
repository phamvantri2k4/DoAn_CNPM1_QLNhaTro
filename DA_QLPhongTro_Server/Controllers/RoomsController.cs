using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    private static string NormalizeRoomStatus(string? status)
    {
        var s = (status ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(s)) return "Còn trống";

        // Backward compat
        if (string.Equals(s, "AVAILABLE", StringComparison.OrdinalIgnoreCase)) return "Còn trống";
        if (string.Equals(s, "RENTED", StringComparison.OrdinalIgnoreCase)) return "Đang thuê";

        return s;
    }

    public RoomsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Room>>> GetRooms([FromQuery] int? ownerId, [FromQuery] int? hostelId)
    {
        var query = _db.Rooms.AsQueryable();

        // Nếu là chủ trọ, luôn lọc theo OwnerId trong token (giống HostelsController)
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (User.IsInRole("owner") && int.TryParse(userIdClaim, out var ownerIdFromToken))
        {
            query = query.Where(r => r.OwnerId == ownerIdFromToken);
        }
        else if (ownerId.HasValue)
        {
            query = query.Where(r => r.OwnerId == ownerId.Value);
        }

        if (hostelId.HasValue)
        {
            query = query.Where(r => r.HostelId == hostelId.Value);
        }

        var data = await query.AsNoTracking().ToListAsync();
        return Ok(data);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<Room>> GetRoom(int id)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room == null) return NotFound();
        return Ok(room);
    }

    public class CreateRoomRequest
    {
        public int? HostelId { get; set; }
        public string Title { get; set; } = string.Empty;
        public double? Area { get; set; }
        public decimal Price { get; set; }
        public decimal Deposit { get; set; }
        public string? UtilitiesDescription { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<Room>> CreateRoom([FromBody] CreateRoomRequest body)
    {
        if (body == null) return BadRequest(new { message = "Dữ liệu không hợp lệ" });
        if (string.IsNullOrWhiteSpace(body.Title)) return BadRequest(new { message = "Vui lòng nhập tên phòng" });

        // Owner: luôn set OwnerId theo token và bắt buộc có HostelId
        int ownerUserId = 0;
        var isOwner = User.IsInRole("owner");
        var isAdmin = User.IsInRole("admin");

        if (isOwner)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out ownerUserId)) return Unauthorized();
            if (!body.HostelId.HasValue) return BadRequest(new { message = "Thiếu hostelId" });
        }

        // Với thiết kế hiện tại (phòng thuộc trọ), luôn cần hostelId để lấy owner
        if (!body.HostelId.HasValue) return BadRequest(new { message = "Thiếu hostelId" });

        var hostel = await _db.Hostels.AsNoTracking().FirstOrDefaultAsync(h => h.Id == body.HostelId.Value);
        if (hostel == null) return BadRequest(new { message = "hostelId không hợp lệ" });

        if (isOwner && hostel.OwnerId != ownerUserId) return Forbid();

        // Admin: derive OwnerId từ trọ
        if (isAdmin && ownerUserId == 0)
        {
            ownerUserId = hostel.OwnerId;
        }

        var room = new Room
        {
            OwnerId = ownerUserId,
            HostelId = body.HostelId,
            Title = body.Title,
            Area = body.Area,
            Price = body.Price,
            Deposit = body.Deposit,
            UtilitiesDescription = body.UtilitiesDescription,
            Status = "Còn trống"
        };

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] Room update)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room == null) return NotFound();

        room.Title = update.Title;
        room.Area = update.Area;
        room.Price = update.Price;
        room.Deposit = update.Deposit;
        room.UtilitiesDescription = update.UtilitiesDescription;
        room.Status = update.Status ?? room.Status;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room == null) return NotFound();
        
        var hostelId = room.HostelId;

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();
        
        return NoContent();
    }

    public class UpdateRoomStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateRoomStatusRequest request)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room == null) return NotFound();

        room.Status = NormalizeRoomStatus(request.Status);
        await _db.SaveChangesAsync();
        return Ok();
    }
}
