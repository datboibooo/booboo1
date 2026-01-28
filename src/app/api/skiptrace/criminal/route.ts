import { NextRequest, NextResponse } from 'next/server';
import { CriminalRecords } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const state = request.nextUrl.searchParams.get('state') || undefined;
  const type = request.nextUrl.searchParams.get('type') || 'all';

  // Parse name
  let first = firstName;
  let last = lastName;
  if (name && !firstName && !lastName) {
    const parts = name.split(' ');
    first = parts[0];
    last = parts.slice(1).join(' ') || parts[0];
  }

  if (!first || !last) {
    return NextResponse.json(
      { error: 'firstName and lastName (or name) are required' },
      { status: 400 }
    );
  }

  try {
    const results: {
      inmateSearch?: Awaited<ReturnType<typeof CriminalRecords.searchInmate>>;
      sexOffenderSearch?: Awaited<ReturnType<typeof CriminalRecords.searchSexOffender>>;
      warrantSearch?: Awaited<ReturnType<typeof CriminalRecords.searchWarrants>>;
      backgroundCheckUrls?: ReturnType<typeof CriminalRecords.getBackgroundCheckUrls>;
    } = {};

    if (type === 'all' || type === 'inmate') {
      results.inmateSearch = await CriminalRecords.searchInmate(first, last, state);
    }

    if (type === 'all' || type === 'sexoffender') {
      results.sexOffenderSearch = await CriminalRecords.searchSexOffender(first, last, state);
    }

    if (type === 'all' || type === 'warrant') {
      results.warrantSearch = await CriminalRecords.searchWarrants(first, last, state);
    }

    // Always include background check providers
    results.backgroundCheckUrls = CriminalRecords.getBackgroundCheckUrls(`${first} ${last}`);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Criminal search error:', error);
    return NextResponse.json(
      { error: 'Failed to search criminal records', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, state, searchType } = body;

    // Parse name
    let first = firstName;
    let last = lastName;
    if (name && !firstName && !lastName) {
      const parts = name.split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ') || parts[0];
    }

    if (!first || !last) {
      return NextResponse.json(
        { error: 'firstName and lastName are required' },
        { status: 400 }
      );
    }

    const fullName = `${first} ${last}`;

    switch (searchType) {
      case 'inmate':
        const inmateResult = await CriminalRecords.searchInmate(first, last, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'inmate',
            ...inmateResult,
          },
        });

      case 'sexoffender':
        const sexOffenderResult = await CriminalRecords.searchSexOffender(first, last, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'sexoffender',
            ...sexOffenderResult,
          },
        });

      case 'warrant':
        const warrantResult = await CriminalRecords.searchWarrants(first, last, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'warrant',
            ...warrantResult,
          },
        });

      case 'arrest':
        const arrestUrls = CriminalRecords.getArrestUrls(fullName, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'arrest',
            searchUrls: arrestUrls,
          },
        });

      default:
        // Comprehensive search
        const [inmateSearch, sexOffenderSearch, warrantSearch] = await Promise.all([
          CriminalRecords.searchInmate(first, last, state),
          CriminalRecords.searchSexOffender(first, last, state),
          CriminalRecords.searchWarrants(first, last, state),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            inmateSearch,
            sexOffenderSearch,
            warrantSearch,
            arrestUrls: CriminalRecords.getArrestUrls(fullName, state),
            backgroundCheckUrls: CriminalRecords.getBackgroundCheckUrls(fullName),
          },
        });
    }
  } catch (error) {
    console.error('Criminal search error:', error);
    return NextResponse.json(
      { error: 'Failed to search criminal records', details: String(error) },
      { status: 500 }
    );
  }
}
