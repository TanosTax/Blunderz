using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddSeparateRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BlitzRating",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BulletRating",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ClassicalRating",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RapidRating",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlitzRating",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BulletRating",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ClassicalRating",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RapidRating",
                table: "Users");
        }
    }
}
