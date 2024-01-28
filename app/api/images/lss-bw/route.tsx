import { NextResponse } from 'next/server';

export async function GET() {
    const img = await fetch('https://land-sea-and-sky.vercel.app/lss-bw.png').then((res) => res.blob());
    return new NextResponse(img, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': "max-age=10',
        }
    })
}
