import { defineChannel } from "eve/channels";
import { eveChannel } from "eve/channels/eve";

export default defineChannel(
  eveChannel({
    path: "/api/chat",
  }),
);
