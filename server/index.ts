import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS for native mobile apps (Capacitor)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow capacitor:// and https://localhost for native iOS/Android apps
  const allowedOrigins = ['capacitor://localhost', 'https://localhost', 'http://localhost'];
  if (origin && (allowedOrigins.includes(origin) || origin.includes('fayaflex.com'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Cache-busting endpoint to clear all service workers and caches
// Users can visit /clear-cache to force-clear all cached data
app.get('/clear-cache', (req, res) => {
  res.set('Clear-Site-Data', '"cache", "cookies", "storage"');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Cache Cleared</title></head>
    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>Cache Cleared!</h1>
      <p>All cached data and service workers have been cleared.</p>
      <p><a href="/">Go to FayaFlex</a></p>
      <script>
        // Also manually unregister all service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
          });
          // Clear all caches
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Cache control headers for optimal caching strategy
app.use((req, res, next) => {
  // Long-lived cache for hashed assets (Vite adds hash to filenames)
  if (req.path.startsWith('/assets/')) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // No cache for HTML pages to ensure fresh content
  else if (req.headers.accept?.includes('text/html') && !req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});

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
        logLine = logLine.slice(0, 79) + "…";
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
