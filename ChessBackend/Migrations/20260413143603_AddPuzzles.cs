using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ChessBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddPuzzles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Puzzles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fen = table.Column<string>(type: "text", nullable: false),
                    Moves = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Themes = table.Column<string>(type: "text", nullable: false),
                    Popularity = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Puzzles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserPuzzleAttempts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PuzzleId = table.Column<int>(type: "integer", nullable: false),
                    Solved = table.Column<bool>(type: "boolean", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    AttemptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPuzzleAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPuzzleAttempts_Puzzles_PuzzleId",
                        column: x => x.PuzzleId,
                        principalTable: "Puzzles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPuzzleAttempts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Puzzles_Rating",
                table: "Puzzles",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_Puzzles_Themes",
                table: "Puzzles",
                column: "Themes");

            migrationBuilder.CreateIndex(
                name: "IX_UserPuzzleAttempts_PuzzleId",
                table: "UserPuzzleAttempts",
                column: "PuzzleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPuzzleAttempts_UserId",
                table: "UserPuzzleAttempts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPuzzleAttempts_UserId_PuzzleId",
                table: "UserPuzzleAttempts",
                columns: new[] { "UserId", "PuzzleId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPuzzleAttempts");

            migrationBuilder.DropTable(
                name: "Puzzles");
        }
    }
}
