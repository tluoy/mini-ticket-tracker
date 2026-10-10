import "dotenv/config";
import express from "express";
import { pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

const statuses = ["Open", "In Progress", "Closed"] as const;
const priorities = ["Low", "Medium", "High"] as const;

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.get("/api/tickets", async (req, res) => {
  const status = req.query.status;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    res.status(400).json({
      error: "Page must be positive and limit must be between 1 and 100",
    });
    return;
  }

  if (
    status !== undefined &&
    (typeof status !== "string" ||
      !(statuses as readonly string[]).includes(status))
  ) {
    res.status(400).json({ error: "Invalid ticket status" });
    return;
  }

  const whereClause = status ? "WHERE status = $1" : "";
  const filterParams = status ? [status] : [];
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tickets ${whereClause}`,
      filterParams,
    );

    const total: number = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT * FROM tickets
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${filterParams.length + 1}
       OFFSET $${filterParams.length + 2}`,
      [...filterParams, limit, offset],
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to retrieve tickets" });
  }
});

app.post("/api/tickets", async (req, res) => {
  const { title, description = "", priority = "Medium" } = req.body ?? {};

  if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
    res.status(400).json({
      error: "Title is required and must be at most 120 characters",
    });
    return;
  }

  if (typeof description !== "string" || description.length > 5000) {
    res.status(400).json({ error: "Invalid description" });
    return;
  }

  if (!(priorities as readonly string[]).includes(priority)) {
    res.status(400).json({ error: "Invalid priority" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (title, description, priority)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title.trim(), description.trim(), priority],
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

app.patch("/api/tickets/:id", async (req, res) => {
  const id = req.params.id;
  const { status, priority } = req.body ?? {};

  if (!/^[1-9]\d*$/.test(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  if (status === undefined && priority === undefined) {
    res.status(400).json({
      error: "Provide a status or priority to update",
    });
    return;
  }

  if (
    status !== undefined &&
    !(statuses as readonly string[]).includes(status)
  ) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  if (
    priority !== undefined &&
    !(priorities as readonly string[]).includes(priority)
  ) {
    res.status(400).json({ error: "Invalid priority" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE tickets
       SET
         status = COALESCE($1, status),
         priority = COALESCE($2, priority),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status ?? null, priority ?? null, id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

app.get("/api/tickets/stats", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM tickets
      GROUP BY status
      ORDER BY status
    `);

    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to retrieve ticket statistics" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Ticket Tracker API listening on port ${port}`);
});
