using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddDisconnectTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BlackPlayerConnected",
                table: "Games",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "BlackPlayerLastSeen",
                table: "Games",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "WhitePlayerConnected",
                table: "Games",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "WhitePlayerLastSeen",
                table: "Games",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlackPlayerConnected",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "BlackPlayerLastSeen",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "WhitePlayerConnected",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "WhitePlayerLastSeen",
                table: "Games");
        }
    }
}
