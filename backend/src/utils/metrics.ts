import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// 1. Create a Registry
export const register = new client.Registry();

// 2. Collect default metrics (CPU, Memory of the Node process)
client.collectDefaultMetrics({ register });

// 3. Custom Metric: HTTP Request Duration (Histogram)
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10], // Response time buckets
});
register.registerMetric(httpRequestDurationMicroseconds);

// 4. Custom Metric: HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// 5. Middleware to measure requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // When the response finishes, record the metrics
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // convert to seconds
    
    // Clean up the route for metrics (e.g., /api/equipment/123 becomes /api/equipment/:id)
    const route = req.route ? req.route.path : req.path;
    
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode,
    };

    httpRequestDurationMicroseconds.observe(labels, duration);
    httpRequestCounter.inc(labels);
  });

  next();
};