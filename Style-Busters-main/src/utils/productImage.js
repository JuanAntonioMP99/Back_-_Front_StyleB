/**
 * Resuelve la imagen de un producto.
 *
 * El modelo Product del backend expone `imageURL` (String, con default
 * "https://placehold.co/600x400"). Los componentes leían `imagesUrl` —un array
 * que la API nunca devuelve—, así que ninguna ficha mostraba su imagen real.
 * Este helper es el único punto que conoce el nombre del campo.
 */
export const PRODUCT_IMAGE_PLACEHOLDER = "/img/products/placeholder.svg";

export function getProductImage(product) {
  const url = product?.imageURL;
  return typeof url === "string" && url.length > 0
    ? url
    : PRODUCT_IMAGE_PLACEHOLDER;
}
