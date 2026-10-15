/**
 * Moving traffic obstacle in the Roadie grid.
 *
 * @remarks
 * Produced by the Roadie simulation (`roadieUtils`) and read by the stage
 * renderer, so both layers share this one contract.
 */
export interface RoadieTrafficCar {
  id: string | number
  textureHash: number
  row: number
  x: number
  speed: number
  width: number
}
