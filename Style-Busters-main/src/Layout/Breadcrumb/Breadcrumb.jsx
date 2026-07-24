import { Link } from "react-router-dom";

/**
 * Migas de pan simples. Recibe items: [{ label, to? }].
 * El último item se muestra como texto plano (posición actual).
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="breadcrumb-item">
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="breadcrumb-separator"> / </span>}
          </span>
        );
      })}
    </nav>
  );
}
