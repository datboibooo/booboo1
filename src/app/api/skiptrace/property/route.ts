import { NextRequest, NextResponse } from 'next/server';
import { PropertyRecords, SkipTraceEngine } from '@/lib/skiptrace';

export const runtime = 'nodejs';

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
    const result = await SkipTraceEngine.searchProperty({
      address,
      city,
      state,
      county,
      ownerName: owner,
      parcelId: parcel,
    });

    return NextResponse.json({
      success: true,
      data: {
        properties: result.properties,
        searchLinks: result.searchLinks,
        sources: result.sources,
      },
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

    // Florida-specific property data
    if (state === 'FL' && county) {
      const floridaData = await PropertyRecords.getFloridaData(county, parcelId, address);
      return NextResponse.json({
        success: true,
        data: {
          state: 'FL',
          county,
          ...floridaData,
        },
      });
    }

    const result = await SkipTraceEngine.searchProperty({
      address,
      city,
      state,
      county,
      ownerName,
      parcelId,
    });

    // Add assessor website info
    const assessorSites = state ? PropertyRecords.assessorWebsites[state] : {};

    return NextResponse.json({
      success: true,
      data: {
        properties: result.properties,
        searchLinks: result.searchLinks,
        sources: result.sources,
        assessorWebsites: assessorSites,
      },
    });
  } catch (error) {
    console.error('Property search error:', error);
    return NextResponse.json(
      { error: 'Failed to search property records', details: String(error) },
      { status: 500 }
    );
  }
}
