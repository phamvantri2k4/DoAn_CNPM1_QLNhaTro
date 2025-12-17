using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Models;
using DA_QLPhongTro_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DA_QLPhongTro_Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly PasswordService _passwordService;
    private readonly JwtService _jwtService;

    public AuthController(ApplicationDbContext db, PasswordService passwordService, JwtService jwtService)
    {
        _db = db;
        _passwordService = passwordService;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequest request)
    {
        var account = await _db.Accounts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a =>
                a.Username == request.UsernameOrEmail ||
                (a.User != null && a.User.Email == request.UsernameOrEmail));

        if (account == null || account.User == null || !_passwordService.VerifyPassword(request.Password, account.PasswordHash))
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "Sai tài khoản hoặc mật khẩu"
            });
        }

        var token = _jwtService.GenerateToken(account, account.User);

        return Ok(new AuthResponseDto
        {
            Success = true,
            Token = token,
            User = MapUserToDto(account.User)
        });
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequest request)
    {
        var existing = await _db.Users
            .Include(u => u.Account)
            .FirstOrDefaultAsync(u => u.Email == request.Email || u.Account.Username == request.Email);

        if (existing != null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Email đã được sử dụng"
            });
        }

        var role = string.IsNullOrWhiteSpace(request.Role) ? "renter" : request.Role!.ToLower();

        var account = new Account
        {
            Username = request.Email,
            PasswordHash = _passwordService.HashPassword(request.Password),
            Role = role,
            Status = "ACTIVE"
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var user = new User
        {
            AccountId = account.Id,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Address = string.Empty
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwtService.GenerateToken(account, user);

        return Ok(new AuthResponseDto
        {
            Success = true,
            Token = token,
            User = MapUserToDto(user)
        });
    }

    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var accountIdClaim = User.Claims.FirstOrDefault(c => c.Type == "accountId")?.Value;
        if (!int.TryParse(accountIdClaim, out var accountId))
        {
            return Unauthorized();
        }

        var account = await _db.Accounts.FindAsync(accountId);
        if (account == null)
        {
            return NotFound();
        }

        if (!_passwordService.VerifyPassword(request.OldPassword, account.PasswordHash))
        {
            return BadRequest("Mật khẩu cũ không đúng");
        }

        account.PasswordHash = _passwordService.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
        return Ok();
    }

    private static UserDto MapUserToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Phone = user.Phone ?? string.Empty,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Address = user.Address,
            Role = user.Account?.Role ?? string.Empty,
            Status = user.Account?.Status ?? string.Empty
        };
    }
}
