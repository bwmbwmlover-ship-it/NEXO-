import { PRODUCTS } from "../lib/products";
import { ProductCan } from "./ProductCan";

/** Owns every can instance. Mount order matters: products register their
 *  useFrame callbacks before the camera rig settles, which is fine — the
 *  camera is read, never written, from here. */
export function ProductManager() {
  return (
    <group>
      {PRODUCTS.map((product, i) => (
        <ProductCan key={product.id} index={i} />
      ))}
    </group>
  );
}
