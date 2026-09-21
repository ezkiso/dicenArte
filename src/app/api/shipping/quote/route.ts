import { NextRequest, NextResponse } from "next/server";
import { calculateShippingQuote } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const latitude = body?.lat;
  const longitude = body?.lng;

  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude)
  ) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  try {
    return NextResponse.json(calculateShippingQuote(latitude, longitude));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo calcular el despacho." },
      { status: 400 }
    );
  }
}