import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: "Open" | "In Progress" | "Closed";
  priority: "Low" | "Medium" | "High";
  created_at: string;
};

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets");

        if (!response.ok) {
          throw new Error("Unable to load tickets.");
        }

        const result: { data: Ticket[] } = await response.json();

        if (!Array.isArray(result.data)) {
          throw new Error("Invalid ticket data received from the server.");
        }

        setTickets(result.data);
      } catch {
        setError("Could not load tickets. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    }

    void loadTickets();
  }, []);

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, priority }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create ticket.");
      }

      setTickets((currentTickets) => [data as Ticket, ...currentTickets]);
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create ticket.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleTicketUpdate(
    ticketId: string,
    updates: Partial<Pick<Ticket, "status" | "priority">>,
  ) {
    setUpdatingTicketId(ticketId);
    setUpdateError("");

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update ticket.");
      }

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === ticketId ? (data as Ticket) : ticket,
        ),
      );
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update ticket.",
      );
    } finally {
      setUpdatingTicketId(null);
    }
  }

  const openCount = tickets.filter((ticket) => ticket.status === "Open").length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "In Progress",
  ).length;
  const closedCount = tickets.filter(
    (ticket) => ticket.status === "Closed",
  ).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-icon">T</span>
          <span>TicketDesk</span>
        </a>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation" aria-label="Main navigation">
          <a className="nav-link active" href="#dashboard">
            <span aria-hidden="true">▦</span>
            Dashboard
          </a>
          <a className="nav-link" href="#tickets">
            <span aria-hidden="true">▤</span>
            All tickets
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="avatar">TT</span>
          <div>
            <strong>Ticket Tracker</strong>
            <span className="muted">Support workspace</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>Dashboard</h1>
          </div>
          <span className="api-indicator">
            <span className="status-dot" />
            Ticket management
          </span>
        </header>

        {showCreateForm && (
          <div className="modal-backdrop">
            <section
              className="ticket-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-ticket-title"
            >
              <div className="modal-header">
                <h2 id="create-ticket-title">Create a ticket</h2>
                <button
                  className="modal-close"
                  type="button"
                  aria-label="Close form"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTicket}>
                <label htmlFor="ticket-title">Title</label>
                <input
                  id="ticket-title"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  required
                  autoFocus
                  placeholder="Briefly describe the issue"
                />

                <label htmlFor="ticket-description">Description</label>
                <textarea
                  id="ticket-description"
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={5000}
                  rows={4}
                  placeholder="Provide more details (optional)"
                />

                <label htmlFor="ticket-priority">Priority</label>
                <select
                  id="ticket-priority"
                  name="priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as "Low" | "Medium" | "High")
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                {createError && (
                  <p className="form-error" role="alert">
                    {createError}
                  </p>
                )}

                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? "Creating…" : "Create ticket"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        <section className="welcome-section">
          <div>
            <p className="eyebrow">SUPPORT OVERVIEW</p>
            <h2>Good morning!</h2>
            <p className="muted">
              Track issues, manage priorities, and keep work moving.
            </p>
          </div>
        </section>

        <section className="stats-grid" aria-label="Ticket summary">
          <article className="stat-card">
            <span className="stat-label">Total tickets</span>
            <strong className="stat-value">{tickets.length}</strong>
            <span className="muted">Across all statuses</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Open</span>
            <strong className="stat-value">{openCount}</strong>
            <span className="muted">Awaiting action</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">In progress</span>
            <strong className="stat-value">{inProgressCount}</strong>
            <span className="muted">Being worked on</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Closed</span>
            <strong className="stat-value">{closedCount}</strong>
            <span className="muted">Completed issues</span>
          </article>
        </section>

        <section className="tickets-panel" id="tickets">
          <div className="panel-header">
            <div>
              <h2>Recent tickets</h2>
              <p className="muted">Review and manage support requests.</p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setCreateError("");
                setShowCreateForm(true);
              }}
            >
              + New ticket
            </button>
          </div>

          {updateError && (
            <p className="form-error" role="alert">
              {updateError}
            </p>
          )}

          {loading ? (
            <p className="empty-state">Loading tickets...</p>
          ) : error ? (
            <p className="empty-state" role="alert">
              {error}
            </p>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">
                ▤
              </span>
              <h3>No tickets yet</h3>
              <p className="muted">Tickets you create will appear here.</p>
            </div>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <article className="ticket-row" key={ticket.id}>
                  <div className="ticket-details">
                    <h3>{ticket.title}</h3>
                    <p className="muted">
                      {ticket.description || "No description provided."}
                    </p>
                    <small className="muted">
                      Ticket #{ticket.id} ·{" "}
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </small>
                  </div>

                  <div className="ticket-labels">
                    <span
                      className={`ticket-status status-${ticket.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {ticket.status}
                    </span>

                    <span
                      className={`ticket-priority priority-${ticket.priority.toLowerCase()}`}
                    >
                      {ticket.priority}
                    </span>

                    <label className="status-control">
                      <span className="muted">Change status</span>
                      <select
                        aria-label={`Change status for ticket ${ticket.id}`}
                        value={ticket.status}
                        disabled={updatingTicketId === ticket.id}
                        onChange={(event) =>
                          void handleTicketUpdate(ticket.id, {
                            status: event.target.value as Ticket["status"],
                          })
                        }
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>

                      <select
                        value={ticket.priority}
                        disabled={updatingTicketId === ticket.id}
                        onChange={(event) =>
                          void handleTicketUpdate(ticket.id, {
                            priority: event.target.value as Ticket["priority"],
                          })
                        }
                        aria-label={`Priority for ${ticket.title}`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>

                      {updatingTicketId === ticket.id && (
                        <span className="muted">Saving…</span>
                      )}
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
