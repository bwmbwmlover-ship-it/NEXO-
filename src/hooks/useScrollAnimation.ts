import { director, SCENES, useActiveProduct, useDirectorSelector, useFrameSubscription, useSceneIndex } from "../lib/director";

export {
  director,
  SCENES,
  useFrameSubscription,
  useSceneIndex,
  useActiveProduct,
  useDirectorSelector,
};

/**
 * SYSTEM A — scroll animation.
 *
 * Scroll only ever drives: camera path, product placement, scene selection and
 * content visibility. It never writes a rotation value, which is why the cans
 * keep spinning smoothly when scrolling stops.
 */
export function useScrollScene() {
  const sceneIndex = useSceneIndex();
  const activeProduct = useActiveProduct();
  const progress = useDirectorSelector((d) => Math.round(d.progress * 1000) / 1000);
  return { sceneIndex, activeProduct, progress, scene: SCENES[sceneIndex] };
}
