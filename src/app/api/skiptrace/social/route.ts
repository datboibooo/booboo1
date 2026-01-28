import { NextRequest, NextResponse } from 'next/server';
import { SocialMedia } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const company = request.nextUrl.searchParams.get('company') || undefined;
  const location = request.nextUrl.searchParams.get('location') || undefined;
  const email = request.nextUrl.searchParams.get('email') || undefined;

  // Parse name
  let first = firstName;
  let last = lastName;
  if (name && !firstName && !lastName) {
    const parts = name.split(' ');
    first = parts[0];
    last = parts.slice(1).join(' ') || parts[0];
  }

  // Search by email if provided
  if (email && !first) {
    const result = await SocialMedia.searchByEmail(email);
    return NextResponse.json({
      success: true,
      data: {
        searchType: 'email',
        email,
        profiles: result.profiles,
        searchLinks: result.searchLinks,
      },
    });
  }

  if (!first || !last) {
    return NextResponse.json(
      { error: 'firstName and lastName (or name or email) parameters are required' },
      { status: 400 }
    );
  }

  try {
    const result = await SocialMedia.searchProfiles(first, last, {
      location,
      company,
      email,
    });

    return NextResponse.json({
      success: true,
      data: {
        searchType: 'person',
        name: `${first} ${last}`,
        profiles: result.profiles,
        searchLinks: result.searchLinks,
        googleSearchQuery: result.googleSearchQuery,
      },
    });
  } catch (error) {
    console.error('Social search error:', error);
    return NextResponse.json(
      { error: 'Failed to search social profiles', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, company, companyName, location, email, phone, searchType } = body;

    // Company social search
    if (searchType === 'company' || (companyName && !firstName && !lastName)) {
      const result = await SocialMedia.searchCompany(companyName || company);
      return NextResponse.json({
        success: true,
        data: {
          searchType: 'company',
          company: companyName || company,
          profiles: result.profiles,
          searchLinks: result.searchLinks,
        },
      });
    }

    // Phone-based social search
    if (phone) {
      const result = await SocialMedia.searchByPhone(phone);
      return NextResponse.json({
        success: true,
        data: {
          searchType: 'phone',
          phone,
          profiles: result.profiles,
          searchLinks: result.searchLinks,
        },
      });
    }

    // Email-based social search
    if (email && !firstName && !lastName) {
      const result = await SocialMedia.searchByEmail(email);
      return NextResponse.json({
        success: true,
        data: {
          searchType: 'email',
          email,
          profiles: result.profiles,
          searchLinks: result.searchLinks,
        },
      });
    }

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
        { error: 'firstName and lastName are required for person search' },
        { status: 400 }
      );
    }

    const result = await SocialMedia.searchProfiles(first, last, {
      location,
      company,
      email,
    });

    return NextResponse.json({
      success: true,
      data: {
        searchType: 'person',
        name: `${first} ${last}`,
        profiles: result.profiles,
        searchLinks: result.searchLinks,
        googleSearchQuery: result.googleSearchQuery,
      },
    });
  } catch (error) {
    console.error('Social search error:', error);
    return NextResponse.json(
      { error: 'Failed to search social profiles', details: String(error) },
      { status: 500 }
    );
  }
}
