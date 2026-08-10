// export const ENDPOINT = "https://smartchurchbe.onrender.com"

const isProduction = import.meta.env.MODE === "production";

export const ENDPOINT = isProduction
  ? "https://smartchurch.tarxemo.com/graphql/"  // production backend
  : "http://localhost:8000/graphql/";             // local backend



// Revision note [2026-07-24 18:17:28 +0300]: Enhance blog feed pagination control

// Revision note [2026-08-08 09:19:28 +0300]: Improve responsive grid breakpoint spacing

// Activity update [2026-07-20 18:56:34 +0300]: Enhance form input validation and feedback

// Activity update [2026-08-01 08:29:39 +0300]: Refactor route guards and auth check hooks

// Activity update [2026-08-10 10:12:26 +0300]: Update button hover states and active indicators
