using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using DA_QLPhongTro_Server.Data;
using DA_QLPhongTro_Server.Services;
using DA_QLPhongTro_Server.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Allow case-insensitive property name matching (frontend camelCase -> backend PascalCase)
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        // Serialize responses as camelCase to match Angular models (title/createdAt/roomId/...)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;

        // Prevent circular reference crashes when EF Core includes navigation properties
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddOpenApi();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200", "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not found");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not found");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Add custom services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<PasswordService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Use CORS
app.UseCors("AllowAngularApp");

// Serve static files (wwwroot), e.g. image URLs like /uploads/posts/xxx.jpg
app.UseStaticFiles();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations to database and seed initial data
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var passwordService = scope.ServiceProvider.GetRequiredService<PasswordService>();
        
        Console.WriteLine("Applying database migrations...");
        db.Database.Migrate();
        Console.WriteLine("✓ Database migrations completed!");
        
        // Seed admin account if not exists
        SeedAdminAccount(db, passwordService);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR: Failed to setup database: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// Function to seed admin account
static void SeedAdminAccount(ApplicationDbContext db, PasswordService passwordService)
{
    try
    {
        var existingAdminByUsername = db.Accounts.FirstOrDefault(a => a.Username == "admin");
        var existingAdminByEmail = db.Users
            .Include(u => u.Account)
            .FirstOrDefault(u => u.Email == "admin@gmail.com");
        
        if (existingAdminByUsername != null || existingAdminByEmail != null)
        {
            Console.WriteLine("ℹ Admin account already exists. Skipping seed.");
            return;
        }
        
        Console.WriteLine("Creating admin account...");
        
        // Create admin account
        var adminAccount = new Account
        {
            Username = "admin",
            PasswordHash = passwordService.HashPassword("admin123"),
            Role = "admin",
            Status = "Hoạt động"
        };
        
        db.Accounts.Add(adminAccount);
        db.SaveChanges();
        
        // Create admin user
        var adminUser = new User
        {
            AccountId = adminAccount.Id,
            FullName = "Quản trị viên",
            Email = "admin@gmail.com",
            Phone = "0909000000",
            Address = "Hệ thống"
        };
        
        db.Users.Add(adminUser);
        db.SaveChanges();
        
        Console.WriteLine("========================================");
        Console.WriteLine("✓ Admin account created successfully!");
        Console.WriteLine("========================================");
        Console.WriteLine("  Username: admin");
        Console.WriteLine("  Email: admin@gmail.com");
        Console.WriteLine("  Password: admin123");
        Console.WriteLine("  Role: admin");
        Console.WriteLine("========================================");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR: Failed to seed admin account: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

app.Run();
