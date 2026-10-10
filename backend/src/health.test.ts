import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import type { QueryResult } from "pg";
import { createApp } from "./app.js";

test("GET /api/health returns 200 when the database responds", async () => {
  const fakeDb = {
    query: async () => ({}) as QueryResult,
  };

  const app = createApp(fakeDb);
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    status: "ok",
    database: "connected",
  });
});

test("GET /api/health returns 503 when the database fails", async () => {
  const fakeDb = {
    query: async () => {
      throw new Error("Simulated database failure");
    },
  };

  const app = createApp(fakeDb);
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, {
    error: "Database unavailable",
  });
});

test("POST /api/tickets creates a ticket and returns 201", async () => {
  const fakeTicket = {
    id: 1,
    title: "Test ticket",
    description: "Testing ticket creation",
    priority: "High",
    status: "Open",
  };

  let executedQuery = "";
  let executedValues: unknown[] = [];

  const fakeDb = {
    query: async (text: string, values?: unknown[]) => {
      executedQuery = text;
      executedValues = values ?? [];

      return {
        rows: [fakeTicket],
        rowCount: 1,
      } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);

  const response = await request(app).post("/api/tickets").send({
    title: "  Test ticket  ",
    description: "Testing ticket creation",
    priority: "High",
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.title, "Test ticket");
  assert.equal(response.body.status, "Open");
  assert.match(executedQuery, /INSERT INTO tickets/);
  assert.deepEqual(executedValues, [
    "Test ticket",
    "Testing ticket creation",
    "High",
  ]);
});

test("POST /api/tickets rejects an empty title", async () => {
  let queryCalled = false;

  const fakeDb = {
    query: async () => {
      queryCalled = true;
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);

  const response = await request(app)
    .post("/api/tickets")
    .send({ title: "   " });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Title is required and must be at most 120 characters",
  });
  assert.equal(queryCalled, false);
});

test("GET /api/tickets returns paginated tickets", async () => {
  const fakeTicket = {
    id: 1,
    title: "Test ticket",
    status: "Open",
    priority: "Medium",
  };

  let queryCount = 0;

  const fakeDb = {
    query: async () => {
      queryCount++;

      if (queryCount === 1) {
        return {
          rows: [{ total: 1 }],
          rowCount: 1,
        } as unknown as QueryResult;
      }

      return {
        rows: [fakeTicket],
        rowCount: 1,
      } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);

  const response = await request(app).get("/api/tickets?page=1&limit=5");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, [fakeTicket]);
  assert.deepEqual(response.body.pagination, {
    page: 1,
    limit: 5,
    total: 1,
    totalPages: 1,
  });
});

test("GET /api/tickets filters by status", async () => {
  const queries: Array<{ text: string; values?: unknown[] }> = [];

  const fakeDb = {
    query: async (text: string, values?: unknown[]) => {
      queries.push({
        text,
        ...(values !== undefined && { values }),
      });

      if (text.includes("COUNT(*)")) {
        return {
          rows: [{ total: 1 }],
          rowCount: 1,
        } as unknown as QueryResult;
      }

      return {
        rows: [{ id: 2, title: "Open ticket", status: "Open" }],
        rowCount: 1,
      } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);
  const response = await request(app).get("/api/tickets?status=Open");

  assert.equal(response.status, 200);
  assert.equal(response.body.data[0].status, "Open");
  assert.deepEqual(queries[0]?.values, ["Open"]);
  assert.match(queries[1]?.text ?? "", /WHERE status = \$1/);
});

test("GET /api/tickets rejects an invalid page number", async () => {
  let queryCalled = false;

  const fakeDb = {
    query: async () => {
      queryCalled = true;
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);
  const response = await request(app).get("/api/tickets?page=0");

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Page must be positive and limit must be between 1 and 100",
  });
  assert.equal(queryCalled, false);
});

test("PATCH /api/tickets/:id updates ticket status", async () => {
  const fakeTicket = {
    id: 1,
    title: "Test ticket",
    status: "Closed",
    priority: "Medium",
  };

  let executedValues: unknown[] = [];

  const fakeDb = {
    query: async (_text: string, values?: unknown[]) => {
      executedValues = values ?? [];

      return {
        rows: [fakeTicket],
        rowCount: 1,
      } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);
  const response = await request(app)
    .patch("/api/tickets/1")
    .send({ status: "Closed" });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "Closed");
  assert.deepEqual(executedValues, ["Closed", null, "1"]);
});

test("PATCH /api/tickets/:id rejects an invalid status", async () => {
  let queryCalled = false;

  const fakeDb = {
    query: async () => {
      queryCalled = true;
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    },
  };

  const app = createApp(fakeDb);
  const response = await request(app)
    .patch("/api/tickets/1")
    .send({ status: "Pending" });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "Invalid status" });
  assert.equal(queryCalled, false);
});

test("PATCH /api/tickets/:id returns 404 when ticket is missing", async () => {
  const fakeDb = {
    query: async () =>
      ({
        rows: [],
        rowCount: 0,
      }) as unknown as QueryResult,
  };

  const app = createApp(fakeDb);
  const response = await request(app)
    .patch("/api/tickets/999")
    .send({ priority: "High" });

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { error: "Ticket not found" });
});
