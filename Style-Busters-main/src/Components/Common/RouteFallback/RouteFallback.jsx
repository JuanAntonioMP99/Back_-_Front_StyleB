import "./RouteFallback.css";

/**
 * Fallback del <Suspense> de rutas. Reserva la altura mínima del área de
 * contenido para que el Footer no salte al aterrizar el chunk (CLS) y no
 * muestra spinner: en una red normal el chunk llega en pocos ms y un spinner
 * que parpadea se percibe más lento que un hueco estable.
 */
export default function RouteFallback() {
  return <div className="route-fallback" role="status" aria-live="polite" />;
}
