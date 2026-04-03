using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChessBackend.Data;
using ChessBackend.Models;
using System.Security.Cryptography;
using System.Text;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ChessDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ChessDbContext context, ILogger<AuthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterDto dto)
    {
        // Проверка существования пользователя
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
        {
            return BadRequest(new { message = "Username already exists" });
        }

        if (!string.IsNullOrEmpty(dto.Email) && await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            return BadRequest(new { message = "Email already exists" });
        }

        // Создание пользователя
        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = HashPassword(dto.Password),
            IsAnonymous = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"User registered: {user.Username}");

        return Ok(new AuthResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Elo = user.Elo,
            IsAnonymous = user.IsAnonymous
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }

        _logger.LogInformation($"User logged in: {user.Username}");

        return Ok(new AuthResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Elo = user.Elo,
            IsAnonymous = user.IsAnonymous
        });
    }

    [HttpPost("guest")]
    public async Task<ActionResult<AuthResponse>> CreateGuest()
    {
        // Генерация случайного имени для гостя
        var guestName = $"Guest_{Guid.NewGuid().ToString().Substring(0, 8)}";

        var user = new User
        {
            Username = guestName,
            IsAnonymous = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Guest user created: {user.Username}");

        return Ok(new AuthResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Elo = user.Elo,
            IsAnonymous = user.IsAnonymous
        });
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private bool VerifyPassword(string password, string? hash)
    {
        if (string.IsNullOrEmpty(hash))
            return false;

        var passwordHash = HashPassword(password);
        return passwordHash == hash;
    }
}

public record RegisterDto(string Username, string Password, string? Email);
public record LoginDto(string Username, string Password);

public record AuthResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public int Elo { get; set; }
    public bool IsAnonymous { get; set; }
}
