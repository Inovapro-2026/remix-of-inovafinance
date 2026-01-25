import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WHATSAPP_URL = process.env.WHATSAPP_URL || 'http://148.230.76.60:3001';

console.log('--- INOVAFINANCE BACKEND STARTING ---');
console.log(`Port: ${PORT}`);
console.log(`WhatsApp Service Target: ${WHATSAPP_URL}`);

// Proxy configuration for WhatsApp API
app.use('/api/whatsapp', createProxyMiddleware({
    target: WHATSAPP_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/whatsapp': '', // removes /api/whatsapp from the beginning of the request
    },
    onProxyRes: (proxyRes, req, res) => {
        // Ensure we always return JSON for API calls
        proxyRes.headers['content-type'] = 'application/json';
    },
    onError: (err, req, res) => {
        console.error('WhatsApp Proxy Error:', err.message);
        res.status(502).json({
            online: false,
            error: 'WhatsApp service offline or unreachable',
            details: err.message
        });
    }
}));

// Serve static files from Vite build with caching policy
app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            // Never cache index.html
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
            // Cache text/css/js/images
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Handle annoying 404s for missing assets instead of serving HTML
app.get(/^\/assets\/.*/, (req, res) => {
    res.status(404).send('Asset not found');
});

// SPA support: redirect all other requests to index.html
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live at http://0.0.0.0:${PORT}`);
});
