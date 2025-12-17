using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IO;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ProfileController(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var u = await _db.Users.Include(x => x.Account).FirstOrDefaultAsync(x => x.Id == userId);
        if (u == null) return NotFound();

        var dto = new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Phone = u.Phone ?? string.Empty,
            Email = u.Email,
            AvatarUrl = u.AvatarUrl,
            Address = u.Address,
            Role = u.Account?.Role ?? string.Empty,
            Status = u.Account?.Status ?? string.Empty
        };

        return Ok(dto);
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Address { get; set; }
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest update)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var u = await _db.Users.Include(x => x.Account).FirstOrDefaultAsync(x => x.Id == userId);
        if (u == null) return NotFound();

        u.FullName = update.FullName;
        u.Phone = update.Phone;
        u.AvatarUrl = update.AvatarUrl;
        u.Address = update.Address;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("me/avatar")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<object>> UploadAvatar([FromForm] IFormFile file)
    {
        if (file == null || file.Length <= 0) return BadRequest(new { message = "File không hợp lệ" });

        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (u == null) return NotFound();

        var ext = Path.GetExtension(file.FileName);
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext.ToLowerInvariant())) return BadRequest(new { message = "Chỉ hỗ trợ jpg/jpeg/png/webp" });

        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(uploadsDir);

        var name = $"u{userId}_{DateTime.UtcNow:yyyyMMddHHmmssfff}{ext}";
        var fullPath = Path.Combine(uploadsDir, name);
        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var publicUrl = $"/uploads/avatars/{name}";
        u.AvatarUrl = publicUrl;
        await _db.SaveChangesAsync();

        return Ok(new { avatarUrl = publicUrl });
    }
}
