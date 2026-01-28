import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address') || undefined;
  const city = request.nextUrl.searchParams.get('city') || undefined;
  const state = request.nextUrl.searchParams.get('state') || undefined;
  const county = request.nextUrl.searchParams.get('county') || undefined;
  const owner = request.nextUrl.searchParams.get('owner') || undefined;
  const parcel = request.nextUrl.searchParams.get('parcel') || undefined;

  if (!address && !owner && !parcel) {
    return NextResponse.json(
      { error: 'At least one search parameter is required (address, owner, or parcel)' },
      { status: 400 }
    );
  }

  try {
    const result = await AISearch.searchProperty({
      address,
      city,
      state,
      county,
      ownerName: owner,
      parcelId: parcel,
    });

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Property search error:', error);
    return NextResponse.json(
      { error: 'Failed to search property records', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, city, state, county, ownerName, parcelId } = body;

    if (!address && !ownerName && !parcelId) {
      return NextResponse.json(
        { error: 'At least one search parameter is required (address, ownerName, or parcelId)' },
        { status: 400 }
      );
    }

    const result = await AISearch.searchProperty({
      address,
      city,
      state,
      county,
      ownerName,
      parcelId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Property search error:', error);
    return NextResponse.json(
      { error: 'Failed to search property records', details: String(error) },
      { status: 500 }
    );
  }
}
