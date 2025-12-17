using Microsoft.EntityFrameworkCore;
using DA_QLPhongTro_Server.Models;

namespace DA_QLPhongTro_Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Hostel> Hostels { get; set; }
    public DbSet<Post> Posts { get; set; }
    public DbSet<RentalRequest> RentalRequests { get; set; }
    public DbSet<RentalInfo> RentalInfos { get; set; }
    public DbSet<Review> Reviews { get; set; }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Track hostel IDs that need room count updates
        var hostelIdsToUpdate = new HashSet<int>();

        // Check added rooms
        var addedRooms = ChangeTracker.Entries<Room>()
            .Where(e => e.State == EntityState.Added && e.Entity.HostelId.HasValue);
        
        foreach (var room in addedRooms)
        {
            if (room.Entity.HostelId.HasValue)
                hostelIdsToUpdate.Add(room.Entity.HostelId.Value);
        }

        // Check deleted rooms
        var deletedRooms = ChangeTracker.Entries<Room>()
            .Where(e => e.State == EntityState.Deleted && e.Entity.HostelId.HasValue);
        
        foreach (var room in deletedRooms)
        {
            if (room.Entity.HostelId.HasValue)
                hostelIdsToUpdate.Add(room.Entity.HostelId.Value);
        }

        // Check modified rooms where HostelId changed
        var modifiedRooms = ChangeTracker.Entries<Room>()
            .Where(e => e.State == EntityState.Modified && 
                       e.Property("HostelId").IsModified && 
                       e.Entity.HostelId.HasValue);
        
        foreach (var room in modifiedRooms)
        {
            if (room.Entity.HostelId.HasValue)
                hostelIdsToUpdate.Add(room.Entity.HostelId.Value);
            
            // Also update old hostel if HostelId changed
            var originalHostelId = room.Property("HostelId").OriginalValue;
            if (originalHostelId != null && originalHostelId is int oldId)
            {
                hostelIdsToUpdate.Add(oldId);
            }
        }

        // Save changes first
        var result = await base.SaveChangesAsync(cancellationToken);

        // Update room counts for affected hostels
        if (hostelIdsToUpdate.Any())
        {
            foreach (var hostelId in hostelIdsToUpdate)
            {
                var hostel = await Hostels.FindAsync(new object[] { hostelId }, cancellationToken);
                if (hostel != null)
                {
                    hostel.RoomCount = await Rooms.CountAsync(r => r.HostelId == hostelId, cancellationToken);
                }
            }
            
            // Save the updated room counts
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình precision và scale cho các trường decimal
        // Room - Price và Deposit
        modelBuilder.Entity<Room>()
            .Property(r => r.Price)
            .HasPrecision(18, 2); // decimal(18,2) cho GiaThue

        modelBuilder.Entity<Room>()
            .Property(r => r.Deposit)
            .HasPrecision(18, 2); // decimal(18,2) cho TienCoc

        // RentalInfo - MonthlyPrice và Deposit
        modelBuilder.Entity<RentalInfo>()
            .Property(ri => ri.MonthlyPrice)
            .HasPrecision(18, 2); // decimal(18,2) cho DonGiaThue

        modelBuilder.Entity<RentalInfo>()
            .Property(ri => ri.Deposit)
            .HasPrecision(18, 2); // decimal(18,2) cho TienCoc

        // TAIKHOAN - NGUOIDUNG relationship (1:1)
        // Theo ERD: TAIKHOAN ||--|| NGUOIDUNG
        // NGUOIDUNG có MaTK (AccountId) là foreign key
        modelBuilder.Entity<User>()
            .HasOne(u => u.Account)
            .WithOne(a => a.User)
            .HasForeignKey<User>(u => u.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        // User - Room relationship (1:many) trực tiếp (chủ trọ sở hữu phòng)
        modelBuilder.Entity<Room>()
            .HasOne(r => r.Owner)
            .WithMany(u => u.Rooms)
            .HasForeignKey(r => r.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - Hostel relationship (1:many): một chủ trọ có nhiều trọ
        modelBuilder.Entity<Hostel>()
            .HasOne(h => h.Owner)
            .WithMany() // nếu muốn có ICollection<Hostel> trong User có thể thêm sau
            .HasForeignKey(h => h.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Hostel - Room relationship (1:many): một trọ có nhiều phòng
        modelBuilder.Entity<Room>()
            .HasOne(r => r.Hostel)
            .WithMany(h => h.Rooms)
            .HasForeignKey(r => r.HostelId)
            .OnDelete(DeleteBehavior.Restrict);

        // Room - Post relationship (1:many)
        modelBuilder.Entity<Post>()
            .HasOne(p => p.Room)
            .WithMany(r => r.Posts)
            .HasForeignKey(p => p.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // Room - RentalRequest relationship (1:many)
        modelBuilder.Entity<RentalRequest>()
            .HasOne(rr => rr.Room)
            .WithMany(r => r.RentalRequests)
            .HasForeignKey(rr => rr.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - RentalRequest relationship (1:many)
        modelBuilder.Entity<RentalRequest>()
            .HasOne(rr => rr.Renter)
            .WithMany(u => u.RentalRequests)
            .HasForeignKey(rr => rr.RenterId)
            .OnDelete(DeleteBehavior.Restrict);

        // YEUCAUTHUE - THONGTINTHUE relationship (1 - 0..1)
        // Theo ERD: YEUCAUTHUE ||--o| THONGTINTHUE
        modelBuilder.Entity<RentalRequest>()
            .HasOne(rr => rr.RentalInfo)
            .WithOne(ri => ri.Request)
            .HasForeignKey<RentalInfo>(ri => ri.RequestId)
            .OnDelete(DeleteBehavior.Restrict);

        // Room - RentalInfo relationship (1:many)
        modelBuilder.Entity<RentalInfo>()
            .HasOne(ri => ri.Room)
            .WithMany(r => r.RentalInfos)
            .HasForeignKey(ri => ri.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - RentalInfo relationship (1:many)
        modelBuilder.Entity<RentalInfo>()
            .HasOne(ri => ri.Renter)
            .WithMany(u => u.RentalInfos)
            .HasForeignKey(ri => ri.RenterId)
            .OnDelete(DeleteBehavior.Restrict);

        // Room - Review relationship (1:many)
        modelBuilder.Entity<Review>()
            .HasOne(rv => rv.Room)
            .WithMany(r => r.Reviews)
            .HasForeignKey(rv => rv.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - Review relationship (1:many)
        modelBuilder.Entity<Review>()
            .HasOne(rv => rv.Renter)
            .WithMany(u => u.Reviews)
            .HasForeignKey(rv => rv.RenterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
