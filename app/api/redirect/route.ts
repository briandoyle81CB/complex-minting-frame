import { NextRequest, NextResponse } from 'next/server';

const REDIRECT_TO_URL = 'https://base-mints-frame.vercel.app/postredirecttest';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(REDIRECT_TO_URL, {status: 302});
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
