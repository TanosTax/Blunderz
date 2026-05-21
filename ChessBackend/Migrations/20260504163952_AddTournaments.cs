using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTournaments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tournaments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatorUserId = table.Column<int>(type: "integer", nullable: false),
                    IsPrivate = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TimeControl = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BestOf = table.Column<int>(type: "integer", nullable: false),
                    BreakMinutesBetweenRounds = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CurrentRound = table.Column<int>(type: "integer", nullable: false),
                    RoundReadyAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tournaments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tournaments_Users_CreatorUserId",
                        column: x => x.CreatorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TournamentMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    SlotIndex = table.Column<int>(type: "integer", nullable: false),
                    PlayerAId = table.Column<int>(type: "integer", nullable: true),
                    PlayerBId = table.Column<int>(type: "integer", nullable: true),
                    WinnerId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    BestOf = table.Column<int>(type: "integer", nullable: false),
                    AWins = table.Column<int>(type: "integer", nullable: false),
                    BWins = table.Column<int>(type: "integer", nullable: false),
                    GameId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TournamentMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TournamentMatches_Games_GameId",
                        column: x => x.GameId,
                        principalTable: "Games",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TournamentMatches_Tournaments_TournamentId",
                        column: x => x.TournamentId,
                        principalTable: "Tournaments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TournamentMatches_Users_PlayerAId",
                        column: x => x.PlayerAId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TournamentMatches_Users_PlayerBId",
                        column: x => x.PlayerBId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TournamentMatches_Users_WinnerId",
                        column: x => x.WinnerId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TournamentParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Seed = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TournamentParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TournamentParticipants_Tournaments_TournamentId",
                        column: x => x.TournamentId,
                        principalTable: "Tournaments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TournamentParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_GameId",
                table: "TournamentMatches",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_PlayerAId",
                table: "TournamentMatches",
                column: "PlayerAId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_PlayerBId",
                table: "TournamentMatches",
                column: "PlayerBId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_TournamentId_RoundNumber_SlotIndex",
                table: "TournamentMatches",
                columns: new[] { "TournamentId", "RoundNumber", "SlotIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_WinnerId",
                table: "TournamentMatches",
                column: "WinnerId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentParticipants_TournamentId_Seed",
                table: "TournamentParticipants",
                columns: new[] { "TournamentId", "Seed" });

            migrationBuilder.CreateIndex(
                name: "IX_TournamentParticipants_TournamentId_UserId",
                table: "TournamentParticipants",
                columns: new[] { "TournamentId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TournamentParticipants_UserId",
                table: "TournamentParticipants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_CreatedAt",
                table: "Tournaments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_CreatorUserId",
                table: "Tournaments",
                column: "CreatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_RoomName",
                table: "Tournaments",
                column: "RoomName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_Status",
                table: "Tournaments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TournamentMatches");

            migrationBuilder.DropTable(
                name: "TournamentParticipants");

            migrationBuilder.DropTable(
                name: "Tournaments");
        }
    }
}
