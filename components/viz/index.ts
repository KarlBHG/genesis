/**
 * Bespoke visualisation primitives. d3 supplies scales, shapes, and one force
 * layout; there is no chart library, because every chart here has to say what
 * its numbers are and where they came from.
 */
export { Bar } from "@/components/viz/bar";
export { EdgeRow, type EdgeRowProgram, type EdgeRowSide } from "@/components/viz/edge-row";
export { EgoNetwork } from "@/components/viz/ego-network";
export {
  egoLayout,
  type EgoLayout,
  type EgoLink,
  type EgoNode,
} from "@/components/viz/ego-layout";
export { Magnitude } from "@/components/viz/magnitude";
export { PolicyTreemap, type TreemapCell } from "@/components/viz/policy-treemap";
export {
  basisLabel,
  comparable,
  printedFigure,
  unitLabel,
  widestFigure,
} from "@/components/viz/money";
