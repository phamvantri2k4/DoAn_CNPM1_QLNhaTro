using System.Security.Cryptography;
using System.Text;

namespace DA_QLPhongTro_Server.Services;

public class PasswordService
{
    public string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public bool VerifyPassword(string password, string hash)
    {
        var hashOfInput = HashPassword(password);
        return SlowEquals(hashOfInput, hash);
    }

    private static bool SlowEquals(string a, string b)
    {
        var aBytes = Encoding.UTF8.GetBytes(a);
        var bBytes = Encoding.UTF8.GetBytes(b);
        uint diff = (uint)aBytes.Length ^ (uint)bBytes.Length;
        for (int i = 0; i < aBytes.Length && i < bBytes.Length; i++)
        {
            diff |= (uint)(aBytes[i] ^ bBytes[i]);
        }
        return diff == 0;
    }
}
