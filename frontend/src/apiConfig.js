const API_BASE_URL = import.meta.env.VITE_API_URL || (
    typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8080/api"
        : "https://mygpt-b2yj.onrender.com/api"
);

export default API_BASE_URL;

