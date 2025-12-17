using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DA_QLPhongTro_Server.Migrations
{
    /// <inheritdoc />
    public partial class FixRoomCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update RoomCount for all existing hostels
            migrationBuilder.Sql(@"
                UPDATE Hostels
                SET RoomCount = (
                    SELECT COUNT(*)
                    FROM Rooms
                    WHERE Rooms.HostelId = Hostels.Id
                )
                WHERE RoomCount != (
                    SELECT COUNT(*)
                    FROM Rooms
                    WHERE Rooms.HostelId = Hostels.Id
                )
            ");

            // Create trigger to automatically update RoomCount when rooms are added/removed
            migrationBuilder.Sql(@"
                CREATE TRIGGER TR_UpdateHostelRoomCount_Insert
                ON Rooms
                AFTER INSERT
                AS
                BEGIN
                    UPDATE Hostels
                    SET RoomCount = (
                        SELECT COUNT(*)
                        FROM Rooms
                        WHERE Rooms.HostelId = Hostels.Id
                    )
                    WHERE Id IN (SELECT HostelId FROM inserted WHERE HostelId IS NOT NULL)
                END
            ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER TR_UpdateHostelRoomCount_Delete
                ON Rooms
                AFTER DELETE
                AS
                BEGIN
                    UPDATE Hostels
                    SET RoomCount = (
                        SELECT COUNT(*)
                        FROM Rooms
                        WHERE Rooms.HostelId = Hostels.Id
                    )
                    WHERE Id IN (SELECT HostelId FROM deleted WHERE HostelId IS NOT NULL)
                END
            ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER TR_UpdateHostelRoomCount_Update
                ON Rooms
                AFTER UPDATE
                AS
                BEGIN
                    -- Update old hostels when HostelId changes
                    UPDATE Hostels
                    SET RoomCount = (
                        SELECT COUNT(*)
                        FROM Rooms
                        WHERE Rooms.HostelId = Hostels.Id
                    )
                    WHERE Id IN (SELECT HostelId FROM deleted WHERE HostelId IS NOT NULL AND HostelId != (SELECT HostelId FROM inserted WHERE inserted.Id = Rooms.Id))

                    -- Update new hostels when HostelId changes
                    UPDATE Hostels
                    SET RoomCount = (
                        SELECT COUNT(*)
                        FROM Rooms
                        WHERE Rooms.HostelId = Hostels.Id
                    )
                    WHERE Id IN (SELECT HostelId FROM inserted WHERE HostelId IS NOT NULL AND HostelId != (SELECT HostelId FROM deleted WHERE deleted.Id = Rooms.Id))
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TR_UpdateHostelRoomCount_Insert");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TR_UpdateHostelRoomCount_Delete");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TR_UpdateHostelRoomCount_Update");
        }
    }
}
