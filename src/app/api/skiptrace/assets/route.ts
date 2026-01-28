import { NextRequest, NextResponse } from 'next/server';
import { AssetsWealth } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  const company = request.nextUrl.searchParams.get('company');
  const type = request.nextUrl.searchParams.get('type') || 'all';

  if (!name && !company) {
    return NextResponse.json(
      { error: 'name or company parameter is required' },
      { status: 400 }
    );
  }

  try {
    const results: {
      aircraftSearch?: Awaited<ReturnType<typeof AssetsWealth.searchAircraftByOwner>>;
      vesselSearch?: Awaited<ReturnType<typeof AssetsWealth.searchVesselByOwner>>;
      wealthSearchUrls?: ReturnType<typeof AssetsWealth.getWealthSearchUrls>;
      businessSearchUrls?: ReturnType<typeof AssetsWealth.getBusinessWealthUrls>;
    } = {};

    if (name) {
      if (type === 'all' || type === 'aircraft') {
        results.aircraftSearch = await AssetsWealth.searchAircraftByOwner(name);
      }

      if (type === 'all' || type === 'vessel') {
        results.vesselSearch = await AssetsWealth.searchVesselByOwner(name);
      }

      results.wealthSearchUrls = AssetsWealth.getWealthSearchUrls(name);
    }

    if (company) {
      results.businessSearchUrls = AssetsWealth.getBusinessWealthUrls(company);
    }

    return NextResponse.json({
      success: true,
      data: results,
      wealthIndicators: AssetsWealth.wealthIndicators,
    });
  } catch (error) {
    console.error('Assets search error:', error);
    return NextResponse.json(
      { error: 'Failed to search assets', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, nNumber, vesselName, searchType } = body;

    switch (searchType) {
      case 'aircraft':
        if (nNumber) {
          const result = await AssetsWealth.searchAircraftByNNumber(nNumber);
          return NextResponse.json({
            success: true,
            data: { type: 'aircraft', ...result },
          });
        }
        if (name) {
          const result = await AssetsWealth.searchAircraftByOwner(name);
          return NextResponse.json({
            success: true,
            data: { type: 'aircraft', ...result },
          });
        }
        break;

      case 'vessel':
        if (vesselName) {
          const result = await AssetsWealth.searchVesselByName(vesselName);
          return NextResponse.json({
            success: true,
            data: { type: 'vessel', ...result },
          });
        }
        if (name) {
          const result = await AssetsWealth.searchVesselByOwner(name);
          return NextResponse.json({
            success: true,
            data: { type: 'vessel', ...result },
          });
        }
        break;

      default:
        // Comprehensive wealth search
        if (!name && !company) {
          return NextResponse.json(
            { error: 'name or company is required' },
            { status: 400 }
          );
        }

        const results: Record<string, unknown> = {};

        if (name) {
          results.aircraftSearch = await AssetsWealth.searchAircraftByOwner(name);
          results.vesselSearch = await AssetsWealth.searchVesselByOwner(name);
          results.wealthSearchUrls = AssetsWealth.getWealthSearchUrls(name);
        }

        if (company) {
          results.businessSearchUrls = AssetsWealth.getBusinessWealthUrls(company);
        }

        return NextResponse.json({
          success: true,
          data: results,
          wealthIndicators: AssetsWealth.wealthIndicators,
        });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Assets search error:', error);
    return NextResponse.json(
      { error: 'Failed to search assets', details: String(error) },
      { status: 500 }
    );
  }
}
