/**
 * A location in geographic coordinates.
 */
export interface LatLongPosition {
  lat: number;
  long: number;
}

/**
 * A location in SVG coordinates.
 */
export interface SVGPosition {
  x: number;
  y: number;
}

/**
 * Convert a latitude and longitude to an SVG position.
 * @param latLong The latitude and longitude to convert.
 * @returns The SVG position, or null if the latitude and longitude are outside of the map.
 */
export function latLongToSVG(latLong: LatLongPosition): SVGPosition | null {
  const upperRightLatLong: LatLongPosition = {
    lat: 37.774673,
    long: -122.4557844,
  };
  if (latLong.lat > upperRightLatLong.lat) return null;
  if (latLong.long > upperRightLatLong.long) return null;

  const lowerLeftLatLong: LatLongPosition = {
    lat: 37.764193,
    long: -122.5117196,
  };
  if (latLong.lat < lowerLeftLatLong.lat) return null;
  if (latLong.long < lowerLeftLatLong.long) return null;

  const lowerLeftSVG: SVGPosition = { x: 426.07, y: 1219.975 };
  const upperRightSVG: SVGPosition = { x: 2989.5151, y: 627.4388 };

  const xMultiplier =
    (upperRightSVG.x - lowerLeftSVG.x) /
    (upperRightLatLong.long - lowerLeftLatLong.long);
  const x =
    xMultiplier * (latLong.long - lowerLeftLatLong.long) + lowerLeftSVG.x;

  const yMultiplier =
    (upperRightSVG.y - lowerLeftSVG.y) /
    (upperRightLatLong.lat - lowerLeftLatLong.lat);
  const y = yMultiplier * (latLong.lat - lowerLeftLatLong.lat) + lowerLeftSVG.y;

  return { x, y };
}
