export async function requireJson(c, next) {
    const text = await c.req.text();
    if (text.length > 65536) {
        return c.json({ error: "too_large" }, 400);
    }
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        return c.json({ error: "invalid_json" }, 400);
    }
    c.set("body", body);
    await next();
}
