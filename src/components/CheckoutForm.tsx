/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useCartStore } from "@/lib/cartStore";
import { formatClp } from "@/lib/utils";
import type { ShippingQuote } from "@/lib/shipping";


const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Centro por defecto: Santiago, Chile.
const DEFAULT_CENTER = { lat: -33.4489, lng: -70.6693 };

export default function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.totalClp());
  const clear = useCartStore((s) => s.clear);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addressVerified, setAddressVerified] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [retracto, setRetracto] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  async function fetchShippingQuote(lat: number, lng: number) {
    setShippingLoading(true);
    setShippingQuote(null);

    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAddressVerified(false);
        setError(data.error ?? "No se pudo calcular el valor del despacho.");
        return;
      }

      setShippingQuote(data as ShippingQuote);
      setError(null);
    } catch {
      setAddressVerified(false);
      setError("No se pudo calcular el valor del despacho.");
    } finally {
      setShippingLoading(false);
    }
  }

  // Inicializa el mapa, el marcador arrastrable y el autocompletar de
  // direcciones una vez que el script de Google Maps terminó de cargar.
  useEffect(() => {
    if (deliveryMethod === "PICKUP") return;
    if (!mapsReady || !mapDivRef.current || !addressInputRef.current) return;

    geocoderRef.current = new google.maps.Geocoder();

    const map = new google.maps.Map(mapDivRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      streetViewControl: false,
      mapTypeControl: false,
    });
    mapRef.current = map;

    const marker = new google.maps.Marker({
      map,
      position: DEFAULT_CENTER,
      draggable: true,
    });
    markerRef.current = marker;

    // Arrastrar el marcador cuenta como "seleccionar en el mapa": se
    // reverse-geocodifica y se marca como dirección verificada.
    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (!position) return;
      const lat = position.lat();
      const lng = position.lng();

      geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setAddress(results[0].formatted_address);
          setCoords({ lat, lng });
          setAddressVerified(true);
          void fetchShippingQuote(lat, lng);
        } else {
          setAddressVerified(false);
          setError("No pudimos reconocer una dirección en ese punto del mapa.");
        }
      });
    });

    const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: "cl" },
      fields: ["formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) {
        setAddressVerified(false);
        setError("Selecciona una dirección de la lista de sugerencias.");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setAddress(place.formatted_address ?? "");
      setCoords({ lat, lng });
      setAddressVerified(true);
      setError(null);
      void fetchShippingQuote(lat, lng);

      map.setCenter({ lat, lng });
      map.setZoom(16);
      marker.setPosition({ lat, lng });
    });
  }, [mapsReady, deliveryMethod]);

  // Si el usuario sigue tipeando a mano después de haber confirmado una
  // dirección (por el autocompletar o el mapa), invalidamos la selección:
  // no queremos aceptar texto libre sin confirmar como dirección real.
  function handleAddressInputChange(value: string) {
    setAddress(value);
    setAddressVerified(false);
    setShippingQuote(null);
  }

  function handleDeliveryMethodChange(method: "DELIVERY" | "PICKUP") {
    setDeliveryMethod(method);
    setError(null);
    if (method === "PICKUP") {
      setAddress("");
      setCoords(null);
      setAddressVerified(false);
      setShippingQuote({ distanceKm: 0, costClp: 0 });
    } else {
      setShippingQuote(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!retracto || !dataConsent) {
      setError("Debes aceptar ambas condiciones para continuar.");
      return;
    }

    if (deliveryMethod === "DELIVERY" && (!addressVerified || !coords)) {
      setError(
        "Selecciona tu dirección desde las sugerencias mientras escribes, o arrastra el marcador en el mapa. No podemos aceptar una dirección sin confirmar."
      );
      return;
    }

    if (!shippingQuote) {
      setError("Espera a que se calcule el valor del despacho.");
      return;
    }

    setLoading(true);
    try {
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerFirstName: firstName,
          customerLastName: lastName,
          customerEmail: email,
          customerPhone: phone || undefined,
          deliveryMethod,
          shippingAddress: address,
          shippingLat: coords?.lat ?? null,
          shippingLng: coords?.lng ?? null,
          retractoAceptado: retracto,
          dataConsent,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear la orden.");
      }

      const { orderId } = await orderRes.json();

      const webpayRes = await fetch("/api/webpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!webpayRes.ok) throw new Error("No se pudo iniciar el pago con Webpay.");

      const { url, token } = await webpayRes.json();
      clear();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  return (
    <>
      {MAPS_API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
              Nombre
            </label>
            <input
              id="firstName"
              required
              minLength={2}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-base-gray-300 p-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
              Apellido
            </label>
            <input
              id="lastName"
              required
              minLength={2}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-base-gray-300 p-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-base-gray-300 p-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Teléfono (opcional)
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-base-gray-300 p-3 text-sm"
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium">Método de entrega</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 border border-base-gray-300 p-3 text-sm">
              <input
                type="radio"
                name="deliveryMethod"
                checked={deliveryMethod === "DELIVERY"}
                onChange={() => handleDeliveryMethodChange("DELIVERY")}
              />
              <span>
                <strong>Despacho a domicilio</strong>
                <span className="mt-1 block text-xs text-base-gray-500">Calculamos el valor según la dirección.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 border border-base-gray-300 p-3 text-sm">
              <input
                type="radio"
                name="deliveryMethod"
                checked={deliveryMethod === "PICKUP"}
                onChange={() => handleDeliveryMethodChange("PICKUP")}
              />
              <span>
                <strong>Retiro en tienda</strong>
                <span className="mt-1 block text-xs text-base-gray-500">Sin costo de despacho.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {deliveryMethod === "DELIVERY" && <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium">
            Dirección de despacho
          </label>
          <input
            id="address"
            ref={addressInputRef}
            required
            minLength={10}
            value={address}
            onChange={(e) => handleAddressInputChange(e.target.value)}
            placeholder="Empieza a escribir tu dirección..."
            className="w-full border border-base-gray-300 p-3 text-sm"
          />
          <p className="mt-1 text-xs text-base-gray-500">
            Elige una sugerencia mientras escribes, o ajusta el punto exacto arrastrando el
            marcador en el mapa.
          </p>
          <div ref={mapDivRef} className="mt-2 h-64 w-full border border-base-gray-300" />
          {addressVerified ? (
            <p className="mt-1 text-xs text-green-700">✓ Dirección confirmada</p>
          ) : (
            <p className="mt-1 text-xs text-base-gray-500">
              Dirección aún sin confirmar
            </p>
          )}
          {shippingLoading && (
            <p className="mt-2 text-sm text-base-gray-600">Calculando valor del despacho…</p>
          )}
          {shippingQuote && !shippingLoading && (
            <div className="mt-3 border border-base-gray-200 bg-base-gray-50 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span>Despacho ({shippingQuote.distanceKm.toFixed(2)} km)</span>
                <span className="font-semibold">{formatClp(shippingQuote.costClp)}</span>
              </div>
            </div>
          )}
        </div>
        }

        {deliveryMethod === "PICKUP" && (
          <div className="border border-base-gray-200 bg-base-gray-50 p-3 text-sm">
            Retirarás tu pedido en la tienda. No se solicitará dirección y el despacho es gratis.
          </div>
        )}

        <div className="border border-base-gray-300 bg-base-gray-50 p-4 text-sm">
          <p className="font-semibold">Antes de continuar:</p>
          <p className="mt-1 text-base-gray-700">
            Los productos personalizados <strong>no tienen derecho a retracto de 10 días</strong>{" "}
            según la Ley del Consumidor, ya que se confeccionan según tus especificaciones.
          </p>
          <p className="mt-2 text-base-gray-700">
            Aplica <strong>Garantía Legal de 6 meses</strong>. Revisa los{" "}
            <a href="/legal" target="_blank" className="underline">
              Términos y Condiciones
            </a>
            .
          </p>
          <label className="mt-3 flex items-start gap-2">
            <input
              type="checkbox"
              checked={retracto}
              onChange={(e) => setRetracto(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              Acepto que este pedido, al ser personalizado, no tiene derecho a retracto, y he
              leído la Garantía Legal y los Términos y Condiciones.
            </span>
          </label>
          <label className="mt-3 flex items-start gap-2">
            <input
              type="checkbox"
              checked={dataConsent}
              onChange={(e) => setDataConsent(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              Autorizo el tratamiento de mis datos (nombre, correo, teléfono, dirección)
              exclusivamente para gestionar este pedido y su despacho.
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex items-center justify-between border-t border-base-gray-200 pt-4">
          <div className="text-right text-sm">
            <p>Productos: {formatClp(total)}</p>
            <p>Despacho: {shippingQuote ? formatClp(shippingQuote.costClp) : "Por calcular"}</p>
            <p className="mt-1 text-lg font-semibold">
              Total: {formatClp(total + (shippingQuote?.costClp ?? 0))}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="bg-base-black px-6 py-3 text-sm font-semibold text-base-white disabled:opacity-50"
          >
            {loading ? "Redirigiendo a Webpay…" : "Pagar con Webpay"}
          </button>
        </div>
      </form>
    </>
  );
}