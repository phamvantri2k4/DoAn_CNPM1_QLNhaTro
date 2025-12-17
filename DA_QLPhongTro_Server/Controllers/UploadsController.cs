using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    [HttpPost("post-image")]
    [Authorize(Roles = "owner,admin")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadPostImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "File không hợp lệ" });
        }

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowed.Contains(file.ContentType))
        {
            return BadRequest(new { message = "Chỉ hỗ trợ ảnh jpg/png/webp" });
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
        {
            ext = file.ContentType switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };
        }

        var root = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "posts");
        Directory.CreateDirectory(root);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(root, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/posts/{fileName}";
        return Ok(new { url });
    }
}
