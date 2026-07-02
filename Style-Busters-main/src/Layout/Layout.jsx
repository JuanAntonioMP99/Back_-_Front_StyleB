import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import { Outlet } from "react-router-dom";


export default function Layout({ children }) {
    
    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header></Header>
            <main className="main-content">
                <div className="container">
                    {children}
                </div>
            </main>
            <Footer></Footer>
        </div>
    );
}