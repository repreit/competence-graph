import { Hono } from "hono";

const remoteConfig = new Hono();

remoteConfig.get("/list", (c) => c.json({ config: null }));

export default remoteConfig;
