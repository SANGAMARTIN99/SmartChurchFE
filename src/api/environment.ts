// export const ENDPOINT = "https://smartchurchbe.onrender.com"

const isProduction = import.meta.env.MODE === "production";

export const ENDPOINT = isProduction
  ? "https://smartchurch.tarxemo.com/graphql/"  // production backend
  : "http://localhost:8000/graphql/";             // local backend



// Revision note [2026-07-24 18:17:28 +0300]: Enhance blog feed pagination control
