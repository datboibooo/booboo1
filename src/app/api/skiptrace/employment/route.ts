import { NextRequest, NextResponse } from 'next/server';
import { EmploymentHistory } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const company = request.nextUrl.searchParams.get('company') || undefined;

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
    const result = await EmploymentHistory.search(first, last, {
      currentCompany: company,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Employment search error:', error);
    return NextResponse.json(
      { error: 'Failed to search employment', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, company, industry, location, searchType, personName } = body;

    // Parse name
    let first = firstName;
    let last = lastName;
    if (name && !firstName && !lastName) {
      const parts = name.split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ') || parts[0];
    }

    switch (searchType) {
      case 'company':
        if (!company) {
          return NextResponse.json(
            { error: 'company is required for company employee search' },
            { status: 400 }
          );
        }
        const companyResult = await EmploymentHistory.searchCompanyEmployees(company);
        return NextResponse.json({
          success: true,
          data: { type: 'company', ...companyResult },
        });

      case 'verify':
        if (!personName || !company) {
          return NextResponse.json(
            { error: 'personName and company are required for verification' },
            { status: 400 }
          );
        }
        const verifyResult = await EmploymentHistory.verifyEmployment(personName, company);
        return NextResponse.json({
          success: true,
          data: { type: 'verify', ...verifyResult },
        });

      default:
        // Comprehensive employment search
        if (!first || !last) {
          return NextResponse.json(
            { error: 'firstName and lastName are required' },
            { status: 400 }
          );
        }
        const result = await EmploymentHistory.search(first, last, {
          currentCompany: company,
          industry,
          location,
        });
        return NextResponse.json({
          success: true,
          data: result,
        });
    }
  } catch (error) {
    console.error('Employment search error:', error);
    return NextResponse.json(
      { error: 'Failed to search employment', details: String(error) },
      { status: 500 }
    );
  }
}
