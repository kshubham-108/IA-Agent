import { NextResponse } from "next/server";

import { getAvailableYears, loadRates } from "@/lib/rates";

export async function GET() {
  const rates = loadRates();
  return NextResponse.json({
    defaultYear: rates.defaultYear,
    years: getAvailableYears(),
    rates: rates.tcs_consumer_data,
  });
}
