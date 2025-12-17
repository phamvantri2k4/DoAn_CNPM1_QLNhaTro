using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _db.Users.Include(u => u.Account).AsNoTracking().ToListAsync();
        var dtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Phone = u.Phone ?? string.Empty,
            Email = u.Email,
            AvatarUrl = u.AvatarUrl,
            Address = u.Address,
            Role = u.Account.Role,
            Status = u.Account.Status
        });
        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var u = await _db.Users.Include(x => x.Account).FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return NotFound();

        var dto = new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Phone = u.Phone ?? string.Empty,
            Email = u.Email,
            AvatarUrl = u.AvatarUrl,
            Address = u.Address,
            Role = u.Account.Role,
            Status = u.Account.Status
        };
        return Ok(dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UserDto update)
    {
        var u = await _db.Users.Include(x => x.Account).FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return NotFound();

        u.FullName = update.FullName;
        u.Phone = update.Phone;
        u.Email = update.Email;
        u.AvatarUrl = update.AvatarUrl;
        u.Address = update.Address;
        u.Account.Role = update.Role;
        u.Account.Status = update.Status;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:int}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var u = await _db.Users.Include(x => x.Account).FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return NotFound();

        u.Account.Status = u.Account.Status == "ACTIVE" ? "LOCKED" : "ACTIVE";
        await _db.SaveChangesAsync();
        return Ok();
    }
}
