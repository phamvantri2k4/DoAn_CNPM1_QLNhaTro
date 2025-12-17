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

        _db.Hostels.Remove(hostel);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
