import { initBotId } from "botid/client/core";

// Invisible bot challenge for the two endpoints that create data. Bot leads
// would not only waste closers' time but also train Meta on fake signals.
initBotId({
  protect: [
    { path: "/api/lead", method: "POST" },
    { path: "/api/calendly/booked", method: "POST" },
  ],
});
