// export const ENDPOINT = "https://smartchurchbe.onrender.com"

const isProduction = import.meta.env.MODE === "production";

export const ENDPOINT = {
  apiUrl: isProduction
    ? "https://smartchurchbe.onrender.com/graphql/"  // production backend
    : "http://localhost:8000/graphql/",             // local backend
};
