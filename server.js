const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const ROOT_DIR = __dirname;

loadEnvFile(path.join(ROOT_DIR, ".env"));

const PORT = Number(process.env.PORT || 3000);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 8 * 1024 * 1024);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function md5(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}

function hmacSha1Base64(secret, value) {
  return crypto.createHmac("sha1", secret).update(value, "utf8").digest("base64");
}

function getRequiredConfig() {
  const bucket = process.env.UPYUN_BUCKET;
  const operator = process.env.UPYUN_OPERATOR;
  const password = process.env.UPYUN_PASSWORD;
  const passwordMd5 = process.env.UPYUN_PASSWORD_MD5 || (password ? md5(password) : "");
  const publicBaseUrl = normalizePublicBaseUrl(process.env.UPYUN_PUBLIC_BASE_URL);
  const uploadHost = process.env.UPYUN_UPLOAD_HOST || "https://v0.api.upyun.com";

  const missing = [];

  if (!bucket) missing.push("UPYUN_BUCKET");
  if (!operator) missing.push("UPYUN_OPERATOR");
  if (!passwordMd5) missing.push("UPYUN_PASSWORD or UPYUN_PASSWORD_MD5");
  if (!publicBaseUrl) missing.push("UPYUN_PUBLIC_BASE_URL");

  if (missing.length) {
    throw new Error(`Missing UPYUN config: ${missing.join(", ")}`);
  }

  return {
    bucket,
    operator,
    passwordMd5,
    publicBaseUrl,
    uploadHost
  };
}

function normalizePublicBaseUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function sanitizeSaveKey(value) {
  const decoded = decodeURIComponent(String(value || ""));

  if (!/^\/email-signature\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]{2,8}$/.test(decoded)) {
    throw new Error("Invalid upload path.");
  }

  return decoded;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    request.on("data", (chunk) => {
      total += chunk.length;

      if (total > MAX_UPLOAD_BYTES) {
        reject(new Error(`Image is too large. Max size is ${MAX_UPLOAD_BYTES} bytes.`));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function signUpyunRestUpload({ bucket, operator, passwordMd5, saveKey, contentMd5, date }) {
  const uri = `/${bucket}${saveKey}`;
  const signatureSource = ["PUT", uri, date, contentMd5].filter(Boolean).join("&");
  const signature = hmacSha1Base64(passwordMd5, signatureSource);

  return {
    uri,
    authorization: `UPYUN ${operator}:${signature}`
  };
}

function uploadToUpyun({ config, saveKey, contentType, body }) {
  return new Promise((resolve, reject) => {
    const contentMd5 = md5(body);
    const date = new Date().toUTCString();
    const { uri, authorization } = signUpyunRestUpload({
      bucket: config.bucket,
      operator: config.operator,
      passwordMd5: config.passwordMd5,
      saveKey,
      contentMd5,
      date
    });
    const uploadUrl = new URL(uri, config.uploadHost);
    const request = https.request(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        Date: date,
        "Content-MD5": contentMd5,
        "Content-Type": contentType || "application/octet-stream",
        "Content-Length": body.length
      }
    }, (response) => {
      const chunks = [];

      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const responseBody = Buffer.concat(chunks).toString("utf8");

        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
          return;
        }

        reject(new Error(`UPYUN returned ${response.statusCode}: ${responseBody || response.statusMessage}`));
      });
    });

    request.on("error", reject);
    request.end(body);
  });
}

async function handleUpyunUpload(request, response) {
  try {
    const config = getRequiredConfig();
    const saveKey = sanitizeSaveKey(request.headers["x-save-key"]);
    const contentType = request.headers["content-type"] || "application/octet-stream";
    const body = await readRequestBody(request);

    if (!body.length) {
      throw new Error("Image body is empty.");
    }

    if (!contentType.startsWith("image/")) {
      throw new Error("Only image uploads are allowed.");
    }

    await uploadToUpyun({
      config,
      saveKey,
      contentType,
      body
    });

    sendJson(response, 200, {
      url: `${config.publicBaseUrl}${saveKey}`,
      path: saveKey
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || "Upload failed."
    });
  }
}

function serveStaticFile(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT_DIR, relativePath);
  const relativeToRoot = path.relative(ROOT_DIR, filePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/upyun-upload") {
    handleUpyunUpload(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    serveStaticFile(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Email signature generator is running at http://localhost:${PORT}`);
});
