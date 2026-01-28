import { NextRequest, NextResponse } from 'next/server';
import { SkipTraceEngine } from '@/lib/skiptrace';
import type { PersonSearchParams } from '@/lib/skiptrace';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const params: PersonSearchParams = {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      city: body.city,
      state: body.state,
      zip: body.zip,
      phone: body.phone,
      email: body.email,
      address: body.address,
      age: body.age,
      ageRange: body.ageRange,
    };

    // Validate required fields
    if (!params.firstName && !params.lastName && !params.phone && !params.email) {
      return NextResponse.json(
        { error: 'At least one search parameter is required (name, phone, or email)' },
        { status: 400 }
      );
    }

    const mode = body.mode || 'standard';
    const results = await SkipTraceEngine.searchPerson(params, mode);

    return NextResponse.json({
      success: true,
      data: results,
      query: params,
      mode,
    });
  } catch (error) {
    console.error('Person search error:', error);
    return NextResponse.json(
      { error: 'Failed to search person', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: PersonSearchParams = {
    firstName: searchParams.get('firstName') || undefined,
    lastName: searchParams.get('lastName') || undefined,
    city: searchParams.get('city') || undefined,
    state: searchParams.get('state') || undefined,
    phone: searchParams.get('phone') || undefined,
    email: searchParams.get('email') || undefined,
  };

  if (!params.firstName && !params.lastName && !params.phone && !params.email) {
    return NextResponse.json(
      { error: 'At least one search parameter is required' },
      { status: 400 }
    );
  }

  const mode = (searchParams.get('mode') as 'quick' | 'standard' | 'deep') || 'quick';
  const results = await SkipTraceEngine.searchPerson(params, mode);

  return NextResponse.json({
    success: true,
    data: results,
    query: params,
    mode,
  });
}
