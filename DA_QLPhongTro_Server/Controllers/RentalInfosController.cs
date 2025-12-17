using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/rental-infos")]
[Authorize]
public class RentalInfosController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public RentalInfosController(ApplicationDbContext db)
    {
        _db = db;
    }

    private int? GetUserId()
    {
        var value = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (int.TryParse(value, out var id)) return id;
        return null;
    }

    [HttpGet]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<IEnumerable<RentalInfo>>> GetAll([FromQuery] int? roomId)
    {
        var query = _db.RentalInfos.AsNoTracking().AsQueryable();

        if (roomId.HasValue)
            query = query.Where(x => x.RoomId == roomId.Value);

        var data = await query.ToListAsync();
        return Ok(data);
    }

    public class CurrentRenterDto
    {
        public int RentalInfoId { get; set; }
        public int RoomId { get; set; }
        public int RenterId { get; set; }
        public string? RenterFullName { get; set; }
        public string? RenterPhone { get; set; }
        public string? RenterEmail { get; set; }
        public DateTime StartDate { get; set; }
        public decimal MonthlyPrice { get; set; }
        public decimal Deposit { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // Owner/Admin: lấy người thuê hiện tại của phòng (RentalInfo đang thuê)
    [HttpGet("current")]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<CurrentRenterDto>> GetCurrent([FromQuery] int roomId)
    {
        if (roomId <= 0) return BadRequest(new { message = "roomId không hợp lệ" });

        const string rentingStatus = "Đang thuê";

        var item = await _db.RentalInfos
            .AsNoTracking()
            .Include(x => x.Renter)
            .Include(x => x.Room)
            .FirstOrDefaultAsync(x => x.RoomId == roomId && (x.Status ?? "") == rentingStatus && x.EndDate == null);

        if (item == null) return NotFound();

        if (User.IsInRole("owner"))
        {
            var ownerUserId = GetUserId();
            if (!ownerUserId.HasValue) return Unauthorized();
            if (item.Room.OwnerId != ownerUserId.Value) return Forbid();
        }

        var dto = new CurrentRenterDto
        {
            RentalInfoId = item.Id,
            RoomId = item.RoomId,
            RenterId = item.RenterId,
            RenterFullName = item.Renter.FullName,
            RenterPhone = item.Renter.Phone,
            RenterEmail = item.Renter.Email,
            StartDate = item.StartDate,
            MonthlyPrice = item.MonthlyPrice,
            Deposit = item.Deposit,
            Status = item.Status
        };

        return Ok(dto);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<RentalInfo>> GetById(int id)
    {
        var item = await _db.RentalInfos.FindAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    // Renter: chỉ xem lịch sử thuê của chính mình
    [HttpGet("my")]
    [Authorize(Roles = "renter")]
    public async Task<ActionResult<IEnumerable<RentalInfo>>> GetMyRentalInfos()
    {
        var renterId = GetUserId();
        if (!renterId.HasValue) return Unauthorized();

        var data = await _db.RentalInfos
            .AsNoTracking()
            .Where(x => x.RenterId == renterId.Value)
            .Include(x => x.Room)
                .ThenInclude(r => r.Hostel)
            .OrderByDescending(x => x.StartDate)
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<RentalInfo>> Create([FromBody] RentalInfo body)
    {
        _db.RentalInfos.Add(body);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = body.Id }, body);
    }

    public class UpdateRentalInfoStatus
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateRentalInfoStatus req)
    {
        var item = await _db.RentalInfos.FindAsync(id);
        if (item == null) return NotFound();

        item.Status = req.Status;
        if (req.Status == "Đã kết thúc" && item.EndDate == null)
        {
            item.EndDate = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("from-request/{requestId:int}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<RentalInfo>> CreateFromRequest(int requestId)
    {
        var req = await _db.RentalRequests
            .Include(r => r.Room)
            .FirstOrDefaultAsync(r => r.Id == requestId);
        if (req == null) return NotFound();

        if (User.IsInRole("owner"))
        {
            var ownerUserId = GetUserId();
            if (!ownerUserId.HasValue) return Unauthorized();
            if (req.Room.OwnerId != ownerUserId.Value) return Forbid();
        }

        var existing = await _db.RentalInfos.AsNoTracking()
            .FirstOrDefaultAsync(x => x.RequestId == requestId);
        if (existing != null) return Conflict(new { message = "Yeu cau nay da duoc tao thong tin thue" });

        var room = req.Room;
        var info = new RentalInfo
        {
            RoomId = req.RoomId,
            RenterId = req.RenterId,
            RequestId = req.Id,
            StartDate = DateTime.UtcNow,
            MonthlyPrice = room.Price,
            Deposit = room.Deposit,
            Status = "Đang thuê"
        };

        req.Status = "APPROVED";
        _db.RentalInfos.Add(info);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = info.Id }, info);
    }
}
