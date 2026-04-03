using ChessBackend.Data;
using ChessBackend.Interfaces;
using ChessBackend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=chessdb;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ChessDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register services
builder.Services.AddScoped<IEloCalculatorService, EloCalculatorService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IMatchmakingService, MatchmakingService>();
builder.Services.AddHostedService<DisconnectTimeoutService>();

// Configure CORS for Telegram Mini App
builder.Services.AddCors(options =>
{
    options.AddPolicy("TelegramPolicy", policy =>
    {
        policy.WithOrigins(
                "https://web.telegram.org", 
                "https://*.telegram.org",
                "http://localhost:5173",
                "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("TelegramPolicy");

app.UseAuthorization();
app.MapControllers();
app.MapHub<ChessBackend.Hubs.ChessHub>("/hubs/chess");

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
