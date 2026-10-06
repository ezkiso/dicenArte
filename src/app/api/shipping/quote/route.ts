import { NextRequest, NextResponse } from "next/server";
import { calculateShippingQuote, resolveShippingPlace } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const placeId = body?.placeId;

  if (typeof placeId !== "string" || placeId.length < 1 || placeId.length > 512) {
    return NextResponse.json({ error: "Selecciona una dirección válida." }, { status: 400 });
  }

  try {
    const place = await resolveShippingPlace(placeId);
    return NextResponse.json(calculateShippingQuote(place.latitude, place.longitude));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo calcular el despacho." },
      { status: 400 }
    );
  }
}