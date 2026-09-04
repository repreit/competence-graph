import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const dir = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(dir, "schema.sql"), "utf8");

try {
    await pool.query(sql);
    console.log("accounts");
    console.log("sessions");
    console.log("nonces");
} finally {
    await pool.end();
}
