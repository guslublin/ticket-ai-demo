namespace api.Models;

public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "";
    public string? AiCategory { get; set; }
    public string? AiPriority { get; set; }
    public string? AiSummary { get; set; }
    public DateTime CreatedAt { get; set; }
}