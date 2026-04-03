using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChessBackend.Data;
using ChessBackend.Models;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ChessDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ChessDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        
        if (user == null)
        {
            return NotFound();
        }

        return user;
    }

    [HttpGet("telegram/{telegramId}")]
    public async Task<ActionResult<User>> GetUserByTelegramId(long telegramId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.TelegramId == telegramId);
        
        if (user == null)
        {
            return NotFound();
        }

        return user;
    }

    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(CreateUserDto dto)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.TelegramId == dto.TelegramId);
        
        if (existingUser != null)
        {
            return Conflict("User already exists");
        }

        var user = new User
        {
            TelegramId = dto.TelegramId,
            Username = dto.Username,
            Elo = 1200,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    [HttpGet("leaderboard")]
    public async Task<ActionResult<List<User>>> GetLeaderboard([FromQuery] int limit = 100)
    {
        var users = await _context.Users
            .OrderByDescending(u => u.Elo)
            .Take(limit)
            .ToListAsync();

        return users;
    }
}

public record CreateUserDto(long TelegramId, string Username);
