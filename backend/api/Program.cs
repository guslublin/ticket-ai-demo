using Oracle.ManagedDataAccess.Client;
using api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontend");

string connectionString = builder.Configuration.GetConnectionString("Oracle")
    ?? throw new Exception("Connection string 'Oracle' no configurada.");

app.MapGet("/", () => Results.Ok(new
{
    message = "Backend ASP.NET Core funcionando"
}));

app.MapGet("/api/tickets", async () =>
{
    var tickets = new List<Ticket>();

    await using var connection = new OracleConnection(connectionString);
    await connection.OpenAsync();

    var sql = @"SELECT id, title, description, status, ai_category, created_at
                FROM tickets
                ORDER BY id DESC";

    await using var command = new OracleCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        tickets.Add(new Ticket
        {
            Id = reader.GetInt32(0),
            Title = reader.GetString(1),
            Description = reader.GetString(2),
            Status = reader.GetString(3),
            AiCategory = reader.IsDBNull(4) ? null : reader.GetString(4),
            CreatedAt = reader.GetDateTime(5)
        });
    }

    return Results.Ok(tickets);
});

app.MapPost("/api/tickets", async (Ticket ticket) =>
{
    await using var connection = new OracleConnection(connectionString);
    await connection.OpenAsync();

    var sql = @"INSERT INTO tickets (title, description, status)
                VALUES (:title, :description, :status)";

    await using var command = new OracleCommand(sql, connection);
    command.Parameters.Add(new OracleParameter("title", ticket.Title));
    command.Parameters.Add(new OracleParameter("description", ticket.Description));
    command.Parameters.Add(new OracleParameter("status", "PENDING"));

    await command.ExecuteNonQueryAsync();

    return Results.Ok(new
    {
        message = "Ticket creado correctamente"
    });
});

app.Run();