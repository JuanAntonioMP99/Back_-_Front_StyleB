import { useLocation } from "react-router-dom";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import "./Layout.css";

export default function Layout({ children }) {
  const location = useLocation();
  return (
    <div className="layout">
      <Header />
      {children}
      <Footer />
    </div>
  );
}