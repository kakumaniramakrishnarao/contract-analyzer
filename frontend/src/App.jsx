import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage   from "./pages/UploadPage";
import AnalysisPage from "./pages/AnalysisPage";
import ChatPage     from "./pages/ChatPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <Routes>
          <Route path="/"            element={<UploadPage />} />
          <Route path="/analysis"    element={<AnalysisPage />} />
          <Route path="/chat"        element={<ChatPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}