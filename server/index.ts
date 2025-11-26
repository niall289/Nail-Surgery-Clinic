import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

// Environment variable logging at startup
console.log('🔧 Environment Configuration:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  PORTAL_WEBHOOK_URL:', process.env.PORTAL_WEBHOOK_URL || 'NOT SET');
console.log('  NAIL_WEBHOOK_SECRET:', process.env.NAIL_WEBHOOK_SECRET ? 
  process.env.NAIL_WEBHOOK_SECRET.slice(0, 5) + '...' : 'NOT SET');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');

const app = express();
import cors from 'cors';
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "â€¦";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5021");
  server.listen(port, "0.0.0.0", () => {
    log(`Express server running on port ${port}`);
  });
})();
