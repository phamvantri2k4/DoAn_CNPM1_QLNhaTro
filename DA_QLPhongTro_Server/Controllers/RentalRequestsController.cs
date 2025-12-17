using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/rental-requests")]
public class RentalRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    private static string NormalizeRequestType(string? requestType)
    {
        var rt = (requestType ?? string.Empty).Trim();
        if (string.Equals(rt, "Thuê phòng", StringComparison.OrdinalIgnoreCase)) rt = "RENT";
        if (string.Equals(rt, "Trả phòng", StringComparison.OrdinalIgnoreCase)) rt = "RETURN";
        if (string.IsNullOrWhiteSpace(rt)) rt = "RENT";
        return rt.ToUpperInvariant();
    }

    private static string NormalizeStatus(string? status)
    {
        var s = (status ?? string.Empty).Trim();
        if (string.Equals(s, "Đã chấp nhận", StringComparison.OrdinalIgnoreCase)) s = "ACCEPTED";
        if (string.Equals(s, "Đã từ chối", StringComparison.OrdinalIgnoreCase)) s = "REJECTED";
        if (string.Equals(s, "APPROVED", StringComparison.OrdinalIgnoreCase)) s = "ACCEPTED";
        if (string.Equals(s, "PENDING", StringComparison.OrdinalIgnoreCase)) s = "PENDING";
        if (string.IsNullOrWhiteSpace(s)) s = "PENDING";
        return s.ToUpperInvariant();
    }

    public RentalRequestsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public class CreateRentalRequestDto
    {
        public int RoomId { get; set; }
        public string? RequestType { get; set; }
        public string? Note { get; set; }
    }

    public class RentalRequestListItemDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public int RenterId { get; set; }
        public DateTime SentDate { get; set; }
        public string? Note { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        public string? RoomTitle { get; set; }
        public string? HostelName { get; set; }
    }

    [HttpGet]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<IEnumerable<RentalRequestListItemDto>>> GetAll()
    {
        var query = _db.RentalRequests.AsQueryable();

        // Nếu là chủ trọ, chỉ xem các yêu cầu thuộc phòng của mình
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (User.IsInRole("owner") && int.TryParse(userIdClaim, out var ownerUserId))
        {
            query = query.Where(rr => rr.Room.OwnerId == ownerUserId);
        }

        var data = await query
            .AsNoTracking()
            .Select(rr => new RentalRequestListItemDto
            {
                Id = rr.Id,
                RoomId = rr.RoomId,
                RenterId = rr.RenterId,
                SentDate = rr.SentDate,
                Note = rr.Note,
                RequestType = rr.RequestType,
                Status = rr.Status,
                RoomTitle = rr.Room != null ? rr.Room.Title : null,
                HostelName = rr.Room != null && rr.Room.Hostel != null ? rr.Room.Hostel.Name : null
            })
            .ToListAsync();

        return Ok(data ?? new List<RentalRequestListItemDto>());
    }

    [HttpGet("pending-count")]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<object>> GetPendingCount()
    {
        var query = _db.RentalRequests.AsQueryable();

        // Nếu là chủ trọ, chỉ đếm các yêu cầu thuộc phòng của mình
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (User.IsInRole("owner") && int.TryParse(userIdClaim, out var ownerUserId))
        {
            query = query.Where(rr => rr.Room.OwnerId == ownerUserId);
        }

        // Pending only
        query = query.Where(rr => (rr.Status ?? "PENDING") == "PENDING");
        var count = await query.AsNoTracking().CountAsync();
        return Ok(new { count });
    }

    [HttpGet("my")]
    [Authorize(Roles = "renter")]
    public async Task<ActionResult<IEnumerable<RentalRequestListItemDto>>> GetMine()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var renterId)) return Unauthorized();

        var data = await _db.RentalRequests
            .AsNoTracking()
            .Where(x => x.RenterId == renterId)
            .OrderByDescending(x => x.SentDate)
            .Select(rr => new RentalRequestListItemDto
            {
                Id = rr.Id,
                RoomId = rr.RoomId,
                RenterId = rr.RenterId,
                SentDate = rr.SentDate,
                Note = rr.Note,
                RequestType = rr.RequestType,
                Status = rr.Status,
                RoomTitle = rr.Room != null ? rr.Room.Title : null,
                HostelName = rr.Room != null && rr.Room.Hostel != null ? rr.Room.Hostel.Name : null
            })
            .ToListAsync();

        return Ok(data ?? new List<RentalRequestListItemDto>());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RentalRequest>> GetById(int id)
    {
        var item = await _db.RentalRequests.FindAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "renter")]
    public async Task<ActionResult<RentalRequest>> Create([FromBody] CreateRentalRequestDto body)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var renterId)) return Unauthorized();

        if (body == null || body.RoomId <= 0)
        {
            return BadRequest(new { message = "RoomId không hợp lệ" });
        }

        var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == body.RoomId);
        if (room == null) return BadRequest(new { message = "RoomId không hợp lệ" });

        // Cho phép frontend gửi 'RENT/RETURN' hoặc 'Thuê phòng/Trả phòng'
        var rt = NormalizeRequestType(body.RequestType);

        var entity = new RentalRequest
        {
            RoomId = body.RoomId,
            RenterId = renterId,
            RequestType = rt,
            Note = body.Note,
            Status = "PENDING",
            SentDate = DateTime.UtcNow
        };

        _db.RentalRequests.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    public class UpdateRequestStatus
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateRequestStatus req)
    {
        var item = await _db.RentalRequests
            .Include(x => x.Room)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound();

        // Owner chỉ được xử lý yêu cầu thuộc phòng của mình
        if (User.IsInRole("owner"))
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out var ownerUserId)) return Unauthorized();
            if (item.Room.OwnerId != ownerUserId) return Forbid();
        }

        var newStatus = NormalizeStatus(req.Status);
        var rt = NormalizeRequestType(item.RequestType);

        // Idempotent: nếu đã ACCEPTED/REJECTED thì không làm lại nghiệp vụ nặng
        if (item.Status == newStatus)
        {
            return Ok();
        }

        item.Status = newStatus;

        if (newStatus == "ACCEPTED")
        {
            if (rt == "RENT")
            {
                // Update room status
                item.Room.Status = "Đang thuê";

                // Hide all visible posts for this room
                var posts = await _db.Posts.Where(p => p.RoomId == item.RoomId && (p.Status ?? "VISIBLE") == "VISIBLE").ToListAsync();
                foreach (var p in posts) p.Status = "HIDDEN";

                // Create RentalInfo if not exists for this rent request
                var existingInfo = await _db.RentalInfos.AsNoTracking().FirstOrDefaultAsync(ri => ri.RequestId == item.Id);
                if (existingInfo == null)
                {
                    var info = new RentalInfo
                    {
                        RoomId = item.RoomId,
                        RenterId = item.RenterId,
                        RequestId = item.Id,
                        StartDate = DateTime.UtcNow,
                        MonthlyPrice = item.Room.Price,
                        Deposit = item.Room.Deposit,
                        Status = "Đang thuê"
                    };
                    _db.RentalInfos.Add(info);
                }
            }
            else if (rt == "RETURN")
            {
                // End active rental info (if any)
                var active = await _db.RentalInfos
                    .FirstOrDefaultAsync(ri => ri.RoomId == item.RoomId && ri.RenterId == item.RenterId && (ri.Status ?? "") == "Đang thuê" && ri.EndDate == null);

                if (active != null)
                {
                    active.Status = "Đã kết thúc";
                    if (active.EndDate == null) active.EndDate = DateTime.UtcNow;
                }

                // Update room status back to available
                item.Room.Status = "Còn trống";

                // Show posts back (optional, helps renters see listing again)
                var posts = await _db.Posts.Where(p => p.RoomId == item.RoomId && (p.Status ?? "VISIBLE") == "HIDDEN").ToListAsync();
                foreach (var p in posts) p.Status = "VISIBLE";
            }
        }

        await _db.SaveChangesAsync();
        return Ok();
    }
}