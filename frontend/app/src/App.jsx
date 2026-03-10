import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function App() {
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit = useMemo(() => {
    return form.title.trim() !== "" && form.description.trim() !== "";
  }, [form]);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/tickets`);

      if (!response.ok) {
        throw new Error("No se pudieron cargar los tickets.");
      }

      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError(err.message || "Ocurrió un error al cargar los tickets.");
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo crear el ticket.");
      }

      setSuccessMessage("Ticket creado y analizado correctamente.");
      setForm({
        title: "",
        description: "",
      });

      await fetchTickets();
    } catch (err) {
      setError(err.message || "Ocurrió un error al crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("es-PY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getPriorityClass = (priority) => {
    const value = (priority || "").toLowerCase();

    if (value === "alta") return "badge priority-high";
    if (value === "media") return "badge priority-medium";
    if (value === "baja") return "badge priority-low";
    return "badge";
  };

  const getStatusClass = (status) => {
    const value = (status || "").toLowerCase();

    if (value === "analyzed") return "badge status-analyzed";
    if (value === "pending") return "badge status-pending";
    return "badge";
  };

  return (
    <div className="app-shell">
      <div className="background-glow glow-1" />
      <div className="background-glow glow-2" />

      <header className="hero">
        <div>
          <p className="eyebrow">Demo Fullstack · React + C# + Oracle + Python + IA</p>
          <h1>Ticket AI Demo</h1>
          <p className="hero-text">
            Sistema de tickets con clasificación automática, prioridad sugerida y
            resumen generado por la capa de IA integrada en el backend.
          </p>
        </div>

        <button className="secondary-btn" onClick={fetchTickets} disabled={loadingTickets}>
          {loadingTickets ? "Actualizando..." : "Refrescar tickets"}
        </button>
      </header>

      {(error || successMessage) && (
        <section className="messages">
          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
        </section>
      )}

      <main className="main-grid">
        <section className="panel glass-card">
          <div className="panel-header">
            <h2>Crear ticket</h2>
            <span className="chip">POST /api/tickets</span>
          </div>

          <form className="ticket-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Título</span>
              <input
                type="text"
                name="title"
                placeholder="Ej. Error login"
                value={form.title}
                onChange={handleChange}
                maxLength={200}
              />
            </label>

            <label className="field">
              <span>Descripción</span>
              <textarea
                name="description"
                placeholder="Describe el problema del usuario..."
                value={form.description}
                onChange={handleChange}
                rows={6}
                maxLength={1000}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={!canSubmit || submitting}>
                {submitting ? "Creando y analizando..." : "Crear ticket"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel glass-card">
          <div className="panel-header">
            <h2>Resumen del sistema</h2>
            <span className="chip">GET /api/tickets</span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total tickets</span>
              <strong className="stat-value">{tickets.length}</strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">Analizados</span>
              <strong className="stat-value">
                {tickets.filter((t) => (t.status || "").toLowerCase() === "analyzed").length}
              </strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">Pendientes</span>
              <strong className="stat-value">
                {tickets.filter((t) => (t.status || "").toLowerCase() === "pending").length}
              </strong>
            </div>
          </div>

          <div className="architecture-box">
            <p>Flujo actual</p>
            <strong>React → ASP.NET Core → Python → IA externa / fallback → Oracle</strong>
          </div>
        </section>
      </main>

      <section className="tickets-section glass-card">
        <div className="panel-header">
          <h2>Tickets registrados</h2>
          <span className="chip">{tickets.length} registros</span>
        </div>

        {loadingTickets ? (
          <div className="empty-state">Cargando tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            Aún no hay tickets. Crea uno desde el formulario de arriba.
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <article className="ticket-card" key={ticket.id}>
                <div className="ticket-top">
                  <div>
                    <p className="ticket-id">Ticket #{ticket.id}</p>
                    <h3>{ticket.title}</h3>
                  </div>

                  <span className={getStatusClass(ticket.status)}>
                    {ticket.status || "Sin estado"}
                  </span>
                </div>

                <p className="ticket-description">{ticket.description}</p>

                <div className="ticket-meta">
                  <span className="meta-item">
                    <strong>Categoría:</strong> {ticket.aiCategory || "Sin clasificar"}
                  </span>
                  <span className={getPriorityClass(ticket.aiPriority)}>
                    Prioridad: {ticket.aiPriority || "No definida"}
                  </span>
                </div>

                <div className="summary-box">
                  <span>Resumen IA</span>
                  <p>{ticket.aiSummary || "Todavía no hay resumen disponible."}</p>
                </div>

                <div className="ticket-footer">
                  <span>Creado: {formatDate(ticket.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;