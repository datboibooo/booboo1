import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Basic VIN validation
function isValidVIN(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  // VIN cannot contain I, O, or Q
  return !/[IOQ]/i.test(vin);
}

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get('vin');

  if (!vin) {
    return NextResponse.json(
      { error: 'vin parameter is required' },
      { status: 400 }
    );
  }

  if (!isValidVIN(vin)) {
    return NextResponse.json(
      { error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' },
      { status: 400 }
    );
  }

  try {
    const result = await AISearch.lookupVIN(vin);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vehicle', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin) {
      return NextResponse.json(
        { error: 'vin is required' },
        { status: 400 }
      );
    }

    if (!isValidVIN(vin)) {
      return NextResponse.json(
        { error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' },
        { status: 400 }
      );
    }

    const result = await AISearch.lookupVIN(vin);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vehicle', details: String(error) },
      { status: 500 }
    );
  }
}
