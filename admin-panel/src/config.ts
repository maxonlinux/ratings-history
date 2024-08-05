const { protocol, host } = window.location;

const config = {
  apiUrl: "/api",
  wsUrl: (protocol === "https:" ? "wss://" : "ws://") + host + "/ws",
};

export { config };
