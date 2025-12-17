using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DA_QLPhongTro_Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnusedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagesJson",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "ExpiredAt",
                table: "Posts");

            // Update RoomCount for all existing hostels
            migrationBuilder.Sql(@"
                UPDATE Hostels
                SET RoomCount = (
                    SELECT COUNT(*)
                    FROM Rooms
                    WHERE Rooms.HostelId = Hostels.Id
                )
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagesJson",
                table: "Rooms",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiredAt",
                table: "Posts",
                type: "datetime2",
                nullable: true);
        }
    }
}
