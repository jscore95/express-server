import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const app = express();

// Enable CORS with various options
app.use(cors({ origin: true }));

// Support for JSON, raw, and text types
app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// Create a proxy middleware
const apiProxy = createProxyMiddleware({
  target: 'https://api.anthropic.com', // The target host of the API you're proxying to
  changeOrigin: true, // Needed for virtual hosted sites
  pathRewrite: { '^/api/v1/proxy': '' }, // Rewrite the path; remove '/api/v1/proxy' before forwarding
  onProxyReq: (proxyReq, req) => {
    // Optional: add or modify headers for the proxied request
    if (req.body && req.method === 'POST') {
      const bodyData = JSON.stringify(req.body);
      // Update header
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write out body changes to the proxyReq stream
      proxyReq.write(bodyData);
    }
  },
});

// Use the proxy middleware for a specific route
app.use('/api/v1/proxy', apiProxy);

const api = express.Router();

api.get('/hello', (req, res) => {
  res.status(200).send({ message: 'hello world' });
});

// Version the api
app.use('/api/v1', api);
