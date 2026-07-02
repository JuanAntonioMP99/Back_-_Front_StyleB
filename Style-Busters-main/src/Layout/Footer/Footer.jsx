import './Footer.css';

export default function Footer() {
  return (
    <footer className="layout-footer">
                <div className="container">
                    <p className="footer-text">&copy; {new Date().getFullYear()} Style Busters. Todos los derechos reservados.</p>
                    <p className="footer-subtext">Mockup para fines demostrativos.</p>
                </div>
    </footer>
  );
}
