import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBcvNumber(value) {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET() {
  try {
    const response = await fetch("https://www.bcv.org.ve/", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo consultar la página del BCV." },
        { status: 500 }
      );
    }

    const html = await response.text();

    const usdMatch =
      html.match(/USD[\s\S]*?<strong>\s*([\d.,]+)\s*<\/strong>/i) ||
      html.match(/USD[\s\S]*?([\d.,]{3,})/i);

    const fechaMatch = html.match(/Fecha Valor:\s*([^<\n]+)/i);

    const usdRate = parseBcvNumber(usdMatch?.[1] || "");
    const fechaValor = fechaMatch?.[1]?.trim() || null;

    if (!usdRate) {
      return NextResponse.json(
        { error: "No se pudo extraer la tasa USD del BCV." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      usdRate,
      fechaValor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Ocurrió un error consultando la tasa BCV." },
      { status: 500 }
    );
  }
}
