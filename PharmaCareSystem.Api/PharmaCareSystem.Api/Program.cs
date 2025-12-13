using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IO;
using PharmaCareSystem.Api.Data;
using PharmaCareSystem.Api.Services;
using PharmaCareSystem.Api.Helpers;
using PharmaCareSystem.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string is not configured.");
}

builder.Services.AddDbContext<PharmaCareDbContext>(options =>
    options.UseSqlServer(
        connectionString,
        sqlServerOptions => 
        {
            sqlServerOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlServerOptions.CommandTimeout(30);
            // Configure to handle tables with triggers
            sqlServerOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        })
    .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.QueryPossibleUnintendedUseOfEqualsWarning))
    .EnableSensitiveDataLogging(false)
    // Register BOTH interceptors - ORDER MATTERS!
    // TriggerSaveChangesInterceptor handles the lifecycle events
    // OutputClauseRemoverInterceptor modifies the SQL commands
    .AddInterceptors(
        new TriggerSaveChangesInterceptor(),
        new OutputClauseRemoverInterceptor()
    ));

// 2. Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 3. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()
                  .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
        });
});

// 4. JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// 5. Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("PharmacistOnly", policy => policy.RequireRole("Pharmacist"));
    options.AddPolicy("PatientOnly", policy => policy.RequireRole("Patient"));
    options.AddPolicy("AdminOrPharmacist", policy => policy.RequireRole("Administrator", "Pharmacist"));
});

// 6. Register Services
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IMedicineService, MedicineService>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IDuplicateMedicineCheckerService, DuplicateMedicineCheckerService>();
builder.Services.AddScoped<IMedicationRequestService, MedicationRequestService>();
builder.Services.AddScoped<IPharmacyService, PharmacyService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IPharmacistNotificationService, PharmacistNotificationService>();

// SignalR
builder.Services.AddSignalR();

// 7. Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "PharmaCare API",
        Version = "v1",
        Description = "Pharmacy Management System API"
    });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Verify database connection (don't create, just verify)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<PharmaCareDbContext>();
        // Just test the connection, don't create database
        var canConnect = await context.Database.CanConnectAsync();
        if (canConnect)
        {
            logger.LogInformation("Successfully connected to database 'PharmaCareDB'.");
        }
        else
        {
            logger.LogWarning("Cannot connect to database 'PharmaCareDB'. Please verify the database exists and your user has access.");
        }
    }
    catch (Microsoft.Data.SqlClient.SqlException sqlEx)
    {
        if (sqlEx.Number == 4060) // Cannot open database
        {
            logger.LogError("Cannot open database 'PharmaCareDB'. Error: {Message}", sqlEx.Message);
            logger.LogError("Please verify:");
            logger.LogError("1. The database 'PharmaCareDB' exists on server 'DESKTOP-VEG8GMM'");
            logger.LogError("2. Your Windows user '{UserName}' has permission to access the database", Environment.UserName);
            logger.LogError("3. SQL Server is running and accessible");
        }
        else if (sqlEx.Number == 18456) // Login failed
        {
            logger.LogError("Login failed for user '{UserName}'. Please check SQL Server authentication settings.", Environment.UserName);
        }
        else
        {
            logger.LogError("SQL Server error {ErrorNumber}: {Message}", sqlEx.Number, sqlEx.Message);
        }
        // Don't throw - let the app start and show the error in logs
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while connecting to the database: {Message}", ex.Message);
        // Don't throw - let the app start
    }
}

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseErrorHandling(); // Custom error handling middleware

app.UseRouting();

// CORS MUST be before HTTPS redirection to handle preflight requests
app.UseCors("AllowReactApp");

// Only redirect to HTTPS in production, not in development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Serve static files including uploaded files
try
{
    var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
    if (!Directory.Exists(wwwrootPath))
    {
        Directory.CreateDirectory(wwwrootPath);
    }
    
    var uploadsPath = Path.Combine(wwwrootPath, "uploads");
    if (!Directory.Exists(uploadsPath))
    {
        Directory.CreateDirectory(uploadsPath);
        Directory.CreateDirectory(Path.Combine(uploadsPath, "profiles"));
        Directory.CreateDirectory(Path.Combine(uploadsPath, "prescriptions"));
    }

    // Serve static files from wwwroot
    app.UseStaticFiles();
    
    // Serve uploaded files from wwwroot/uploads
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
        RequestPath = "/uploads"
    });
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Failed to configure static files. Continuing without file upload support.");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<PharmaCareSystem.Api.Hubs.NotificationHub>("/notificationhub");

app.MapGet("/", () => new
{
    message = "PharmaCare API is running!",
    version = "v1.0",
    timestamp = DateTime.Now
});

app.Run();