import { NextRequest, NextResponse } from 'next/server';
import { ProfessionalLicenses } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const state = request.nextUrl.searchParams.get('state') || undefined;
  const type = request.nextUrl.searchParams.get('type') || undefined;

  // Parse name if provided as single field
  let first = firstName;
  let last = lastName;
  if (name && !firstName && !lastName) {
    const parts = name.split(' ');
    first = parts[0];
    last = parts.slice(1).join(' ') || parts[0];
  }

  if (!first || !last) {
    return NextResponse.json(
      { error: 'firstName and lastName (or name) parameters are required' },
      { status: 400 }
    );
  }

  try {
    const result = await ProfessionalLicenses.searchByName(first, last, state, type);

    return NextResponse.json({
      success: true,
      data: {
        licenses: result.licenses,
        searchUrls: result.searchUrls,
        sources: result.sources,
      },
    });
  } catch (error) {
    console.error('License search error:', error);
    return NextResponse.json(
      { error: 'Failed to search licenses', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, state, licenseType, searchType, licenseNumber } = body;

    // Parse name
    let first = firstName;
    let last = lastName;
    if (name && !firstName && !lastName) {
      const parts = name.split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ') || parts[0];
    }

    const fullName = `${first} ${last}`;

    // Handle specific license type searches
    switch (searchType || licenseType) {
      case 'contractor':
        const contractorResult = await ProfessionalLicenses.searchContractor(fullName, licenseNumber, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'contractor',
            licenses: contractorResult.licenses,
            searchUrls: contractorResult.searchUrls,
          },
        });

      case 'real_estate':
        const realEstateResult = await ProfessionalLicenses.searchRealEstate(fullName, licenseNumber, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'real_estate',
            licenses: realEstateResult.licenses,
            searchUrls: realEstateResult.searchUrls,
          },
        });

      case 'medical':
        const medicalResult = await ProfessionalLicenses.searchMedical(fullName, licenseNumber, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'medical',
            licenses: medicalResult.licenses,
            searchUrls: medicalResult.searchUrls,
          },
        });

      case 'attorney':
        const attorneyResult = await ProfessionalLicenses.searchAttorney(fullName, licenseNumber, state);
        return NextResponse.json({
          success: true,
          data: {
            type: 'attorney',
            licenses: attorneyResult.licenses,
            searchUrls: attorneyResult.searchUrls,
          },
        });

      default:
        // General search
        if (!first || !last) {
          return NextResponse.json(
            { error: 'firstName and lastName are required' },
            { status: 400 }
          );
        }

        const result = await ProfessionalLicenses.searchByName(first, last, state, licenseType);
        return NextResponse.json({
          success: true,
          data: {
            licenses: result.licenses,
            searchUrls: result.searchUrls,
            sources: result.sources,
          },
        });
    }
  } catch (error) {
    console.error('License search error:', error);
    return NextResponse.json(
      { error: 'Failed to search licenses', details: String(error) },
      { status: 500 }
    );
  }
}
