import { createServer } from "node:http";
import { Buffer } from "node:buffer";

const PORT = parseInt(process.env.PORT || "5000", 10);

const { default: handler } = await import("./dist/server/server.js");

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url || "/", `https://${host}`);

    const reqHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) reqHeaders.append(key, v);
        } else {
          reqHeaders.set(key, value);
        }
      }
    }

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      await new Promise((resolve, reject) => {
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", resolve);
        req.on("error", reject);
      });
      const buf = Buffer.concat(chunks);
      if (buf.length > 0) body = buf;
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers: reqHeaders,
      body,
      duplex: body ? "half" : undefined,
    });

    const mockCtx = { waitUntil: () => {}, passThroughOnException: () => {} };
    const response = await handler.fetch(request, {}, mockCtx);

    const resHeaders = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });
    res.writeHead(response.status, resHeaders);

    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }

    res.end();
  } catch (err) {
    console.error("[serve] error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain" });
    }
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
