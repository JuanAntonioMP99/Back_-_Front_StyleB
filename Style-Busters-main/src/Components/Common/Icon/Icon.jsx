import { cloneElement, memo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import CORE_ICONS from "./icons.core.jsx";

// Cache del set secundario una vez resuelto el import() dinámico, para que el
// segundo <Icon /> que pida un icono "extra" lo pinte de forma síncrona.
let extraIcons = null;
let extraPromise = null;

function loadExtraIcons() {
  if (!extraPromise) {
    extraPromise = import("./icons.extra.jsx").then((mod) => {
      extraIcons = mod.default;
      return extraIcons;
    });
  }
  return extraPromise;
}

const Icon = ({ name, size = 20, className = "" }) => {
  // Solo cambia cuando hay que pintar un icono del set secundario que aún no
  // se ha descargado; para los del set base nunca se dispara un re-render.
  const [, forceUpdate] = useState(0);
  const isCore = Object.prototype.hasOwnProperty.call(CORE_ICONS, name);
  const needsExtra = !isCore && extraIcons === null;

  useEffect(() => {
    if (!needsExtra) return;
    let cancelled = false;
    loadExtraIcons().then(() => {
      if (!cancelled) forceUpdate((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [needsExtra]);

  const icon =
    CORE_ICONS[name] || (extraIcons && extraIcons[name]) || CORE_ICONS.user;

  return (
    <span className={`icon ${className}`}>
      {cloneElement(icon, { width: size, height: size })}
    </span>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
};

// Sus props son primitivas (name/size/className): memo evita repintar los ~15
// iconos del Header cada vez que cambia el contador del carrito o el tema.
export default memo(Icon);
