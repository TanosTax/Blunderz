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
builder.Services.AddScoped<IPuzzleService, PuzzleService>();
builder.Services.AddSingleton<IStockfishService, StockfishService>();
builder.Services.AddScoped<AICoachService>();
builder.Services.AddScoped<TournamentService>();
builder.Services.AddHttpClient<AICoachService>()
    .ConfigureHttpClient(client =>
    {
        client.Timeout = TimeSpan.FromMinutes(5); // 5 minutes for AI analysis
    });
builder.Services.AddHostedService<DisconnectTimeoutService>();
builder.Services.AddHostedService<TournamentRoundSchedulerService>();
builder.Services.AddHostedService<TournamentCleanupService>();

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

// Apply migrations automatically on startup (dev-friendly)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ChessDbContext>();
    db.Database.Migrate();
}

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
