import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/react-app/pages/Home";
import AdminPage from "@/react-app/pages/Admin";

export default function App() {
  return (
    <Router basename="/DA-itd-web/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}