using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public class CreateReviewDto
    {
        public int RoomId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public int RenterId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? RenterFullName { get; set; }
    }

    public ReviewsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetAll([FromQuery] int? roomId)
    {
        var query = _db.Reviews
            .AsNoTracking()
            .Include(r => r.Renter)
            .AsQueryable();
        if (roomId.HasValue)
        {
            query = query.Where(r => r.RoomId == roomId.Value);
        }

        var data = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                RoomId = r.RoomId,
                RenterId = r.RenterId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                RenterFullName = r.Renter.FullName
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ReviewDto>> GetById(int id)
    {
        var item = await _db.Reviews
            .AsNoTracking()
            .Include(r => r.Renter)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (item == null) return NotFound();

        var dto = new ReviewDto
        {
            Id = item.Id,
            RoomId = item.RoomId,
            RenterId = item.RenterId,
            Rating = item.Rating,
            Comment = item.Comment,
            CreatedAt = item.CreatedAt,
            RenterFullName = item.Renter.FullName
        };

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "renter")]
    public async Task<ActionResult<Review>> Create([FromBody] CreateReviewDto body)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var renterId)) return Unauthorized();

        if (body == null || body.RoomId <= 0)
        {
            return BadRequest(new { message = "RoomId không hợp lệ" });
        }

        if (body.Rating < 1 || body.Rating > 5)
        {
            return BadRequest(new { message = "Rating phải từ 1 đến 5" });
        }

        var roomExists = await _db.Rooms.AsNoTracking().AnyAsync(r => r.Id == body.RoomId);
        if (!roomExists)
        {
            return BadRequest(new { message = "Phòng không tồn tại" });
        }

        // Renter chỉ được đánh giá phòng mình đã từng thuê (đã được duyệt thuê -> có RentalInfo)
        var rented = await _db.RentalInfos
            .AsNoTracking()
            .AnyAsync(ri => ri.RoomId == body.RoomId && ri.RenterId == renterId);
        if (!rented)
        {
            return Forbid();
        }

        // Chặn spam: mỗi renter chỉ đánh giá 1 lần / 1 phòng
        var alreadyReviewed = await _db.Reviews
            .AsNoTracking()
            .AnyAsync(r => r.RoomId == body.RoomId && r.RenterId == renterId);
        if (alreadyReviewed)
        {
            return BadRequest(new { message = "Bạn đã đánh giá phòng này rồi" });
        }

        var entity = new Review
        {
            RoomId = body.RoomId,
            RenterId = renterId,
            Rating = body.Rating,
            Comment = body.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _db.Reviews.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "renter")]
    public async Task<IActionResult> Update(int id, [FromBody] Review update)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var renterId)) return Unauthorized();

        var item = await _db.Reviews.FindAsync(id);
        if (item == null) return NotFound();

        if (item.RenterId != renterId) return Forbid();

        if (update.Rating < 1 || update.Rating > 5)
        {
            return BadRequest(new { message = "Rating phải từ 1 đến 5" });
        }

        item.Rating = update.Rating;
        item.Comment = update.Comment;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "renter")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Reviews.FindAsync(id);
        if (item == null) return NotFound();

        _db.Reviews.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
