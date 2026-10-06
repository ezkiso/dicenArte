const EARTH_RADIUS_KM = 6371;

export type ShippingQuote = {
  distanceKm: number;
  costClp: number;
};

type ResolvedShippingPlace = {
  address: string;
  latitude: number;
  longitude: number;
};

type GoogleGeocodeResponse = {
  status: string;
  results: {
    formatted_address: string;
    place_id: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: { types: string[]; short_name: string }[];
  }[];
};

export async function resolveShippingPlace(placeId: string): Promise<ResolvedShippingPlace> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) {
    throw new Error("El despacho no está disponible temporalmente.");
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    language: "es",
    region: "cl",
  });

  let response: Response;
  try {
    response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error("No se pudo verificar la dirección. Intenta nuevamente.");
  }

  if (!response.ok) {
    throw new Error("No se pudo verificar la dirección. Intenta nuevamente.");
  }

  const data = (await response.json()) as GoogleGeocodeResponse;
  const result = data.results?.find((item) => item.place_id === placeId);
  const isInChile = result?.address_components.some(
    (component) => component.types.includes("country") && component.short_name === "CL"
  );

  if (data.status !== "OK" || !result || !isInChile) {
    throw new Error("No se pudo verificar una dirección válida en Chile.");
  }

  const { lat: latitude, lng: longitude } = result.geometry.location;
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("No se pudo verificar una dirección válida en Chile.");
  }

  return { address: result.formatted_address, latitude, longitude };
}

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
  if (distanceKm <= 3) costClp = 4000;
  else if (distanceKm <= 7) costClp = 6500;
  else if (distanceKm <= 12) costClp = 9000;
  else costClp = 12000;

  return { distanceKm: Math.round(distanceKm * 100) / 100, costClp };
}