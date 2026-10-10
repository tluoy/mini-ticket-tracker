import "dotenv/config";
import { pool } from "./db.js";
import { createApp } from "./app.js";

const app = createApp(pool);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Ticket Tracker API listening on port ${port}`);
});