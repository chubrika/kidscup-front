import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";

export function createSocket(): Socket {
  // backend socket server is same host as API but without `/api`
  const socketUrl = API_URL.replace(/\/api\/?$/, "");
  return io(socketUrl, { transports: ["websocket"] });
}

