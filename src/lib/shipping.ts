const EARTH_RADIUS_KM = 6371;

export type ShippingQuote = {
  distanceKm: number;
  costClp: number;
};

function requiredCoordinate(name: "WAREHOUSE_LAT" | "WAREHOUSE_LNG") {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) {
    throw new Error(`Falta configurar ${name}.`);
  }
  return value;
}

export function calculateDistanceKm(
  latitude: number,
  longitude: number,
  warehouseLatitude = requiredCoordinate("WAREHOUSE_LAT"),
  warehouseLongitude = requiredCoordinate("WAREHOUSE_LNG")
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(warehouseLatitude - latitude);
  const longitudeDelta = toRadians(warehouseLongitude - longitude);
  const latitude1 = toRadians(latitude);
  const latitude2 = toRadians(warehouseLatitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateShippingQuote(latitude: number, longitude: number): ShippingQuote {
  const distanceKm = calculateDistanceKm(latitude, longitude);
  const maximumDistanceKm = Number(process.env.SHIPPING_MAX_DISTANCE_KM ?? 25);

  if (distanceKm > maximumDistanceKm) {
    throw new Error("La dirección está fuera de nuestra zona de despacho.");
  }

  let costClp: number;
  if (distanceKm <= 3) costClp = 2500;
  else if (distanceKm <= 7) costClp = 4000;
  else if (distanceKm <= 12) costClp = 6000;
  else costClp = 9000;

  return { distanceKm: Math.round(distanceKm * 100) / 100, costClp };
}