// export const ENDPOINT = "https://smartchurchbe.onrender.com"

const isProduction = import.meta.env.MODE === "production";

export const ENDPOINT = isProduction
  ? "https://smartchurch.tarxemo.com/graphql/"  // production backend
  : "http://localhost:8000/graphql/";             // local backend


