import { NextRequest, NextResponse } from 'next/server';
import { SkipTraceEngine, SECEdgar, StateCorporations } from '@/lib/skiptrace';
import type { BusinessSearchParams } from '@/lib/skiptrace';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const params: BusinessSearchParams = {
      name: body.name,
      state: body.state,
      fileNumber: body.fileNumber,
      officerName: body.officerName,
      registeredAgentName: body.registeredAgentName,
      status: body.status,
    };

    if (!params.name && !params.fileNumber && !params.officerName) {
      return NextResponse.json(
        { error: 'At least one search parameter is required (name, fileNumber, or officerName)' },
        { status: 400 }
      );
    }

    const mode = body.mode || 'standard';
    const results = await SkipTraceEngine.searchBusiness(params, mode);

    return NextResponse.json({
      success: true,
      data: results,
      query: params,
      mode,
    });
  } catch (error) {
    console.error('Business search error:', error);
    return NextResponse.json(
      { error: 'Failed to search business', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const name = searchParams.get('name');
  const state = searchParams.get('state') || undefined;
  const cik = searchParams.get('cik');

  // Direct SEC lookup by CIK
  if (cik) {
    const company = await SECEdgar.getCompanyDetails(cik);
    if (company) {
      const financials = await SECEdgar.getFinancials(cik);
      return NextResponse.json({
        success: true,
        data: {
          company,
          financials,
        },
      });
    }
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  if (!name) {
    return NextResponse.json(
      { error: 'name parameter is required' },
      { status: 400 }
    );
  }

  const mode = (searchParams.get('mode') as 'quick' | 'standard' | 'deep') || 'quick';
  const results = await SkipTraceEngine.searchBusiness({ name, state }, mode);

  return NextResponse.json({
    success: true,
    data: results,
    query: { name, state },
    mode,
  });
}
