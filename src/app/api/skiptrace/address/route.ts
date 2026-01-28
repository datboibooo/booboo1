import { NextRequest, NextResponse } from 'next/server';
import { AddressHistory } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const address = request.nextUrl.searchParams.get('address');
  const city = request.nextUrl.searchParams.get('city') || undefined;
  const state = request.nextUrl.searchParams.get('state') || undefined;
  const zip = request.nextUrl.searchParams.get('zip') || undefined;

  // Reverse address lookup
  if (address && city && state) {
    try {
      const result = await AddressHistory.reverseAddress(address, city, state, zip);
      return NextResponse.json({
        success: true,
        data: {
          type: 'reverse',
          address: { street: address, city, state, zip },
          ...result,
        },
      });
    } catch (error) {
      console.error('Reverse address error:', error);
      return NextResponse.json(
        { error: 'Failed to lookup address', details: String(error) },
        { status: 500 }
      );
    }
  }

  // Parse name for person address history
  let first = firstName;
  let last = lastName;
  if (name && !firstName && !lastName) {
    const parts = name.split(' ');
    first = parts[0];
    last = parts.slice(1).join(' ') || parts[0];
  }

  if (!first || !last) {
    return NextResponse.json(
      { error: 'firstName and lastName (or name) are required, or provide address/city/state for reverse lookup' },
      { status: 400 }
    );
  }

  try {
    const result = await AddressHistory.search(first, last, {
      currentCity: city,
      currentState: state,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Address history error:', error);
    return NextResponse.json(
      { error: 'Failed to search address history', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, address, city, state, zip, searchType } = body;

    switch (searchType) {
      case 'reverse':
        if (!address || !city || !state) {
          return NextResponse.json(
            { error: 'address, city, and state are required for reverse lookup' },
            { status: 400 }
          );
        }
        const reverseResult = await AddressHistory.reverseAddress(address, city, state, zip);
        return NextResponse.json({
          success: true,
          data: {
            type: 'reverse',
            address: { street: address, city, state, zip },
            ...reverseResult,
          },
        });

      case 'property':
        if (!state) {
          return NextResponse.json(
            { error: 'state is required for property search' },
            { status: 400 }
          );
        }
        const propertyUrl = AddressHistory.getPropertyUrl(state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'property',
            state,
            searchUrl: propertyUrl,
          },
        });

      case 'voter':
        if (!state) {
          return NextResponse.json(
            { error: 'state is required for voter search' },
            { status: 400 }
          );
        }
        const voterUrl = AddressHistory.getVoterUrl(state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'voter',
            state,
            searchUrl: voterUrl,
          },
        });

      default:
        // Person address history
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

        const result = await AddressHistory.search(first, last, {
          currentCity: city,
          currentState: state,
        });

        return NextResponse.json({
          success: true,
          data: result,
        });
    }
  } catch (error) {
    console.error('Address history error:', error);
    return NextResponse.json(
      { error: 'Failed to search address history', details: String(error) },
      { status: 500 }
    );
  }
}
