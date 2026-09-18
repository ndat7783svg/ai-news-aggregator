export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/tai-khoan";
  return NextResponse.redirect(new URL(next, request.url));
}
