// export const ENDPOINT = "https://smartchurchbe.onrender.com"

const isProduction = import.meta.env.MODE === "production";

export const ENDPOINT = {
  apiUrl: isProduction
    ? "https://smartchurch.tarxemo.com/graphql/"  // production backend
    : "http://smartchurch.tarxemo.com/graphql/",             // local backend
};


