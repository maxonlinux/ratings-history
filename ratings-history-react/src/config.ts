const baseUrl = import.meta.env.VITE_BASE_URL;

if (!baseUrl) {
  throw new Error("Base URL is not defined");
}

const baseUrlSplitted = baseUrl.split("://");

if (baseUrlSplitted.length < 2) {
  throw new Error(
    "Invalid Base URL. Format: http://example.com or https://example.com"
  );
}

const [protocol, url] = baseUrlSplitted;
const secure = protocol.toLowerCase() === "https";

const config = {
  baseUrl: import.meta.env.VITE_BASE_URL,
  apiUrl: `${import.meta.env.VITE_BASE_URL}/api/v1`,
  wsUrl: `${secure ? "wss" : "ws"}://${url}/ws`,
};

export { config };
