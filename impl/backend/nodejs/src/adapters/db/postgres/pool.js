import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("DATABASE_URL is missing");
}

export const pool = new Pool({ connectionString: url, max: 5 });

pool.on("error", (err) => {
    const code = err.code;
    if (
        code === "ECONNRESET" ||
        code === "EPIPE" ||
        code === "ETIMEDOUT" ||
        code === "57P01" ||
        err.message === "Connection terminated unexpectedly"
    ) {
        return;
    }
    console.error(err);
});
