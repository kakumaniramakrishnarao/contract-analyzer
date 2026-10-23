import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Turns an axios error into something worth showing the user
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err.response) return "Can't reach the server. Is the backend running?";
  const detail = err.response.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

// Uploads and extracts the text in one go
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload/", formData, {
    onUploadProgress: (e) => {
      if (e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return response.data;
};

export const analyseContract = async (doc_id) => {
  const response = await api.post(`/analysis/${doc_id}`);
  return response.data;
};

export const sendChatMessage = async (doc_id, question, history) => {
  const response = await api.post("/chat/", { doc_id, question, history });
  return response.data;
};
