using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DA_QLPhongTro_Server.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DA_QLPhongTro_Server.Services;

public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(Account account, User user)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
        var issuer = _config["Jwt:Issuer"] ?? string.Empty;
        var audience = _config["Jwt:Audience"] ?? string.Empty;

        var role = (account.Role ?? string.Empty).Trim().ToLower();

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, account.Id.ToString()),
            new Claim("accountId", account.Id.ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName)
        };

        var keyBytes = Encoding.UTF8.GetBytes(key);
        var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(int.TryParse(_config["Jwt:ExpirationInMinutes"], out var mins) ? mins : 60),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
