import { NextRequest, NextResponse } from 'next/server';
import { SkipTraceEngine } from '@/lib/skiptrace';
import type { PersonSearchParams, BusinessSearchParams } from '@/lib/skiptrace';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for comprehensive reports

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, mode = 'deep', ...params } = body;

    if (!type || (type !== 'person' && type !== 'business')) {
      return NextResponse.json(
        { error: 'type must be "person" or "business"' },
        { status: 400 }
      );
    }

    if (type === 'person') {
      const personParams: PersonSearchParams = {
        firstName: params.firstName,
        lastName: params.lastName,
        middleName: params.middleName,
        city: params.city,
        state: params.state,
        zip: params.zip,
        phone: params.phone,
        email: params.email,
        address: params.address,
        age: params.age,
      };

      if (!personParams.firstName && !personParams.lastName && !personParams.phone && !personParams.email) {
        return NextResponse.json(
          { error: 'At least one identifying parameter is required for person report' },
          { status: 400 }
        );
      }

      const report = await SkipTraceEngine.generateReport('person', personParams, mode);

      return NextResponse.json({
        success: true,
        report,
      });
    }

    if (type === 'business') {
      const businessParams: BusinessSearchParams = {
        name: params.name || params.businessName,
        state: params.state,
        fileNumber: params.fileNumber,
        officerName: params.officerName,
        registeredAgentName: params.registeredAgentName,
      };

      if (!businessParams.name && !businessParams.fileNumber) {
        return NextResponse.json(
          { error: 'Business name or file number is required for business report' },
          { status: 400 }
        );
      }

      const report = await SkipTraceEngine.generateReport('business', businessParams, mode);

      return NextResponse.json({
        success: true,
        report,
      });
    }
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: String(error) },
      { status: 500 }
    );
  }
}

// Quick lookup endpoint for single-field searches
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'auto';

  if (!query) {
    return NextResponse.json(
      { error: 'q (query) parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Auto-detect search type
    let detectedType = type;
    if (type === 'auto') {
      if (query.includes('@')) {
        detectedType = 'email';
      } else if (/^\d{10,}$/.test(query.replace(/\D/g, ''))) {
        detectedType = 'phone';
      } else if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(query)) {
        detectedType = 'vin';
      } else if (query.split(' ').length >= 2 && !query.includes(',')) {
        detectedType = 'person';
      } else {
        detectedType = 'business';
      }
    }

    switch (detectedType) {
      case 'email':
        const emailResult = await SkipTraceEngine.quickEmailLookup(query);
        return NextResponse.json({
          success: true,
          type: 'email',
          data: emailResult,
        });

      case 'phone':
        const phoneResult = await SkipTraceEngine.quickPhoneLookup(query);
        return NextResponse.json({
          success: true,
          type: 'phone',
          data: phoneResult,
        });

      case 'vin':
        const vinResult = await SkipTraceEngine.lookupVIN(query);
        return NextResponse.json({
          success: true,
          type: 'vin',
          data: vinResult,
        });

      case 'person':
        const nameParts = query.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];
        const personResult = await SkipTraceEngine.searchPerson(
          { firstName, lastName },
          'quick'
        );
        return NextResponse.json({
          success: true,
          type: 'person',
          data: personResult,
        });

      case 'business':
      default:
        const businessResult = await SkipTraceEngine.searchBusiness(
          { name: query },
          'quick'
        );
        return NextResponse.json({
          success: true,
          type: 'business',
          data: businessResult,
        });
    }
  } catch (error) {
    console.error('Quick search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}
