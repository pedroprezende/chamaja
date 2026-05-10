const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

const nativeWindConfig = withNativeWind(config, {
  input: "./global.css",
  forceWriteFileSystem: true,
});

const apiProxy = createProxyMiddleware({
  target: "http://localhost:3000",
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error("[proxy] API error:", err.message);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "API server unavailable" }));
      }
    },
  },
});

nativeWindConfig.server = {
  ...nativeWindConfig.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url.startsWith("/api")) {
        apiProxy(req, res, next);
      } else {
        metroMiddleware(req, res, next);
      }
    };
  },
};

module.exports = nativeWindConfig;
