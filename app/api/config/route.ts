import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    waNumber: process.env.WA_NUMBER || '' 
  });
}
