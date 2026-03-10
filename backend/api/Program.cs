using System.Diagnostics;
using System.Text.Json;
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

    var sql = @"SELECT id, title, description, status, ai_category, ai_priority, ai_summary, created_at
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
            AiPriority = reader.IsDBNull(5) ? null : reader.GetString(5),
            AiSummary = reader.IsDBNull(6) ? null : reader.GetString(6),
            CreatedAt = reader.GetDateTime(7)
        });
    }

    return Results.Ok(tickets);
});

app.MapPost("/api/tickets", async (Ticket ticket) =>
{
    string pythonScriptPath = "/src/python/classify_ticket.py";

    string escapedTitle = ticket.Title.Replace("\"", "\\\"");
    string escapedDescription = ticket.Description.Replace("\"", "\\\"");

    var startInfo = new ProcessStartInfo
    {
        FileName = "/opt/venv/bin/python",
        Arguments = $"\"{pythonScriptPath}\" \"{escapedTitle}\" \"{escapedDescription}\"",
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true
    };

    using var process = new Process { StartInfo = startInfo };
    process.Start();

    string pythonOutput = await process.StandardOutput.ReadToEndAsync();
    string pythonError = await process.StandardError.ReadToEndAsync();

    await process.WaitForExitAsync();

    if (process.ExitCode != 0)
    {
        return Results.Json(new
        {
            message = "Error ejecutando Python",
            exitCode = process.ExitCode,
            pythonError,
            pythonOutput
        }, statusCode: 500);
    }

    AiEnrichmentResult aiResult;
    try
    {
        aiResult = JsonSerializer.Deserialize<AiEnrichmentResult>(
            pythonOutput,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        ) ?? new AiEnrichmentResult();
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            message = "Python respondió algo que no se pudo parsear",
            pythonOutput,
            parseError = ex.Message
        }, statusCode: 500);
    }

    await using var connection = new OracleConnection(connectionString);
    await connection.OpenAsync();

    var sql = @"INSERT INTO tickets (title, description, status, ai_category, ai_priority, ai_summary)
                VALUES (:title, :description, :status, :ai_category, :ai_priority, :ai_summary)";

    await using var command = new OracleCommand(sql, connection);
    command.Parameters.Add(new OracleParameter("title", ticket.Title));
    command.Parameters.Add(new OracleParameter("description", ticket.Description));
    command.Parameters.Add(new OracleParameter("status", "ANALYZED"));
    command.Parameters.Add(new OracleParameter("ai_category", aiResult.Category));
    command.Parameters.Add(new OracleParameter("ai_priority", aiResult.Priority));
    command.Parameters.Add(new OracleParameter("ai_summary", aiResult.Summary));

    await command.ExecuteNonQueryAsync();

    return Results.Ok(new
    {
        message = "Ticket creado y analizado correctamente",
        aiResult.Category,
        aiResult.Priority,
        aiResult.Summary
    });
});

app.Run();