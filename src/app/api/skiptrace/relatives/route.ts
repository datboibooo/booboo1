import { NextRequest, NextResponse } from 'next/server';
import { RelativesAssociates } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const address = request.nextUrl.searchParams.get('address') || undefined;
  const city = request.nextUrl.searchParams.get('city') || undefined;
  const state = request.nextUrl.searchParams.get('state') || undefined;

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
    const result = await RelativesAssociates.searchRelatives(first, last, {
      currentAddress: address,
      city,
      state,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Relatives search error:', error);
    return NextResponse.json(
      { error: 'Failed to search relatives', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, address, city, state, searchType } = body;

    // Parse name
    let first = firstName;
    let last = lastName;
    if (name && !firstName && !lastName) {
      const parts = name.split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ') || parts[0];
    }

    switch (searchType) {
      case 'address':
        if (!address || !city || !state) {
          return NextResponse.json(
            { error: 'address, city, and state are required for address search' },
            { status: 400 }
          );
        }
        const addressResult = await RelativesAssociates.searchByAddress(address, city, state);
        return NextResponse.json({
          success: true,
          data: { type: 'address', ...addressResult },
        });

      case 'household':
        if (!address || !city || !state) {
          return NextResponse.json(
            { error: 'address, city, and state are required for household search' },
            { status: 400 }
          );
        }
        const householdResult = await RelativesAssociates.getHouseholdMembers(address, city, state);
        return NextResponse.json({
          success: true,
          data: { type: 'household', ...householdResult },
        });

      case 'neighbors':
        if (!address || !city || !state) {
          return NextResponse.json(
            { error: 'address, city, and state are required for neighbor search' },
            { status: 400 }
          );
        }
        const neighborResult = await RelativesAssociates.searchNeighbors(address, city, state);
        return NextResponse.json({
          success: true,
          data: { type: 'neighbors', ...neighborResult },
        });

      case 'business':
        if (!first || !last) {
          return NextResponse.json(
            { error: 'firstName and lastName are required' },
            { status: 400 }
          );
        }
        const businessResult = await RelativesAssociates.searchBusinessAssociates(`${first} ${last}`);
        return NextResponse.json({
          success: true,
          data: { type: 'business', ...businessResult },
        });

      default:
        // Comprehensive relatives search
        if (!first || !last) {
          return NextResponse.json(
            { error: 'firstName and lastName are required' },
            { status: 400 }
          );
        }
        const result = await RelativesAssociates.searchRelatives(first, last, {
          currentAddress: address,
          city,
          state,
        });
        return NextResponse.json({
          success: true,
          data: result,
        });
    }
  } catch (error) {
    console.error('Relatives search error:', error);
    return NextResponse.json(
      { error: 'Failed to search relatives', details: String(error) },
      { status: 500 }
    );
  }
}
