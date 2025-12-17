using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PostsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public class CreatePostRequest
    {
        public int RoomId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Status { get; set; }
        
        [JsonPropertyName("imagesJson")]
        public string? ImagesJson { get; set; }
    }

    public class UpdatePostRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Status { get; set; }

        [JsonPropertyName("imagesJson")]
        public string? ImagesJson { get; set; }
    }

    // DTO nhẹ dùng cho trang home/feed
    public class PostListItemDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? FirstImage { get; set; }
        public decimal? Price { get; set; }
        public double? Area { get; set; }
        public string? Address { get; set; }
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
    }

    public class PostDetailDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Status { get; set; }

        [JsonPropertyName("imagesJson")]
        public string? ImagesJson { get; set; }

        public decimal? Price { get; set; }
        public double? Area { get; set; }
        public string? Address { get; set; }
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }

        public string? OwnerFullName { get; set; }
        public string? OwnerPhone { get; set; }
        public string? OwnerEmail { get; set; }
    }

    private static string? ExtractSafeFirstImage(string? stored)
    {
        if (string.IsNullOrWhiteSpace(stored)) return null;
        var s = stored.Trim();

        // Legacy: JSON array string[]
        if (s.StartsWith("["))
        {
            try
            {
                var images = JsonSerializer.Deserialize<List<string>>(s);
                s = images != null && images.Count > 0 ? (images[0] ?? string.Empty).Trim() : string.Empty;
            }
            catch
            {
                return null;
            }
        }

        if (string.IsNullOrWhiteSpace(s)) return null;

        // Prevent returning huge base64 payloads which cause very slow load
        // If you want to support base64, store a proper URL instead.
        if (s.Length > 2048) return null;

        // Allow http(s), relative URLs, and data URLs
        if (s.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            s.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            s.StartsWith("/", StringComparison.OrdinalIgnoreCase) ||
            s.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            return s;
        }

        // Unknown format -> ignore
        return null;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Post>>> GetPosts()
    {
        // Public feed: tạm thời trả về tất cả bài đăng để đảm bảo dữ liệu hiển thị đúng
        var data = await _db.Posts.AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        // Không bao giờ trả NoContent, luôn trả về mảng (có thể rỗng)
        return Ok(data ?? new List<Post>());
    }

    [HttpGet("mine")]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<IEnumerable<Post>>> GetMyPosts()
    {
        var query = _db.Posts.AsNoTracking();

        if (User.IsInRole("owner"))
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out var ownerUserId)) return Unauthorized();

            // Lọc theo các phòng thuộc chủ trọ hiện tại
            var ownerRoomIds = await _db.Rooms.AsNoTracking()
                .Where(r => r.OwnerId == ownerUserId)
                .Select(r => r.Id)
                .ToListAsync();
            
            query = query.Where(p => ownerRoomIds.Contains(p.RoomId));
        }

        var data = await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(data ?? new List<Post>());
    }

    // Endpoint nhẹ cho trang home: chỉ trả về field cơ bản + ảnh đầu tiên
    [HttpGet("list")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PostListItemDto>>> GetPostList()
    {
        // Feed only: limit to latest items to keep response fast
        var raw = await _db.Posts.AsNoTracking()
            .Where(p => (p.Status ?? "VISIBLE") == "VISIBLE")
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.RoomId,
                p.Title,
                p.Description,
                p.CreatedAt,
                p.ImagesJson,
                Price = (decimal?)p.Room.Price,
                Area = p.Room.Area,
                Address = p.Room.Hostel != null ? p.Room.Hostel.Address : null,
                Province = p.Room.Hostel != null ? p.Room.Hostel.Province : null,
                District = p.Room.Hostel != null ? p.Room.Hostel.District : null,
                Ward = p.Room.Hostel != null ? p.Room.Hostel.Ward : null
            })
            .Take(50)
            .ToListAsync();

        var result = raw.Select(p => new PostListItemDto
        {
            Id = p.Id,
            RoomId = p.RoomId,
            Title = p.Title,
            Description = p.Description,
            CreatedAt = p.CreatedAt,
            FirstImage = ExtractSafeFirstImage(p.ImagesJson),
            Price = p.Price,
            Area = p.Area,
            Address = p.Address,
            Province = p.Province,
            District = p.District,
            Ward = p.Ward
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<PostDetailDto>> GetPost(int id)
    {
        var data = await _db.Posts.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PostDetailDto
            {
                Id = p.Id,
                RoomId = p.RoomId,
                Title = p.Title,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                Status = p.Status,
                ImagesJson = p.ImagesJson,
                Price = (decimal?)p.Room.Price,
                Area = p.Room.Area,
                Address = p.Room.Hostel != null ? p.Room.Hostel.Address : null,
                Province = p.Room.Hostel != null ? p.Room.Hostel.Province : null,
                District = p.Room.Hostel != null ? p.Room.Hostel.District : null,
                Ward = p.Room.Hostel != null ? p.Room.Hostel.Ward : null,
                OwnerFullName = p.Room.Owner != null ? p.Room.Owner.FullName : null,
                OwnerPhone = p.Room.Owner != null ? p.Room.Owner.Phone : null,
                OwnerEmail = p.Room.Owner != null ? p.Room.Owner.Email : null
            })
            .FirstOrDefaultAsync();

        if (data == null) return NotFound();
        return Ok(data);
    }

    [HttpGet("host/{hostId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Post>>> GetPostsByHost(int hostId)
    {
        // Lấy danh sách phòng của host này
        var hostRoomIds = await _db.Rooms.AsNoTracking()
            .Where(r => r.OwnerId == hostId)
            .Select(r => r.Id)
            .ToListAsync();

        // Lấy tất cả bài đăng VISIBLE thuộc các phòng đó
        var posts = await _db.Posts.AsNoTracking()
            .Where(p => hostRoomIds.Contains(p.RoomId) && (p.Status ?? "VISIBLE") == "VISIBLE")
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(posts);
    }

    [HttpPost]
    [Authorize(Roles = "owner,admin")]
    public async Task<ActionResult<Post>> CreatePost([FromBody] CreatePostRequest body)
    {
        if (body == null) return BadRequest(new { message = "Dữ liệu không hợp lệ" });
        if (body.RoomId <= 0) return BadRequest(new { message = "RoomId không hợp lệ" });
        if (string.IsNullOrWhiteSpace(body.Title)) return BadRequest(new { message = "Vui lòng nhập tiêu đề" });

        var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == body.RoomId);
        if (room == null) return BadRequest(new { message = "RoomId không hợp lệ" });

        // Owner chỉ được tạo bài cho phòng của mình
        if (User.IsInRole("owner"))
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out var ownerUserId)) return Unauthorized();
            if (room.OwnerId != ownerUserId) return Forbid();
        }

        var post = new Post
        {
            RoomId = body.RoomId,
            Title = body.Title,
            Description = body.Description,
            Status = string.IsNullOrWhiteSpace(body.Status) ? "VISIBLE" : body.Status!,
            ImagesJson = body.ImagesJson,
            CreatedAt = DateTime.UtcNow
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostRequest update)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound();

        if (User.IsInRole("owner"))
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out var ownerUserId)) return Unauthorized();
            var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == post.RoomId);
            if (room == null) return BadRequest(new { message = "RoomId không hợp lệ" });
            if (room.OwnerId != ownerUserId) return Forbid();
        }

        if (update == null) return BadRequest(new { message = "Dữ liệu không hợp lệ" });
        if (string.IsNullOrWhiteSpace(update.Title)) return BadRequest(new { message = "Vui lòng nhập tiêu đề" });

        post.Title = update.Title;
        post.Description = update.Description;
        post.Status = string.IsNullOrWhiteSpace(update.Status) ? post.Status : update.Status!;
        post.ImagesJson = update.ImagesJson;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound();

        if (User.IsInRole("owner"))
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out var ownerUserId)) return Unauthorized();
            var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == post.RoomId);
            if (room == null) return BadRequest(new { message = "RoomId không hợp lệ" });
            if (room.OwnerId != ownerUserId) return Forbid();
        }

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public class UpdatePostStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "owner,admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePostStatusRequest request)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound();

        if (User.IsInRole("owner"))
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (!int.TryParse(userIdClaim, out var ownerUserId)) return Unauthorized();
            var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == post.RoomId);
            if (room == null) return BadRequest(new { message = "RoomId không hợp lệ" });
            if (room.OwnerId != ownerUserId) return Forbid();
        }

        post.Status = request.Status;
        await _db.SaveChangesAsync();
        return Ok();
    }
}
