import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/layout";
import HomePage from "./pages/home";
import FlightsPage from "./pages/flights";
import LoginPage from "./pages/login";
import PaymentPage from "./pages/payment";
import UserPage from "./pages/user";
import { ThemeProvider } from "./components/theme/themeProvider";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="flightbook-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="flights" element={<FlightsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="user" element={<UserPage />} />
            <Route path="*" element={<div className="container py-8 text-center">페이지를 찾을 수 없습니다.</div>} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
