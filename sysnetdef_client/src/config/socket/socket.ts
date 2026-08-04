import { Manager } from "socket.io-client";
import { ENV } from "../env";


const manager = new Manager(ENV.WS_BASE_URL, {
  autoConnect: false,
  reconnectionAttempts: ENV.RECONNECT_ATTEMPTS,
  path: "/ws",
});

export const idpsSocket = manager.socket("/idps");

export const systemNotificationSocket = manager.socket("/system_notification");