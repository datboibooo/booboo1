import { NextRequest, NextResponse } from 'next/server';
import { CourtRecords, SkipTraceEngine } from '@/lib/skiptrace';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  const caseNumber = request.nextUrl.searchParams.get('caseNumber');
  const state = request.nextUrl.searchParams.get('state') || undefined;
  const type = request.nextUrl.searchParams.get('type') || undefined;

  if (!name && !caseNumber) {
    return NextResponse.json(
      { error: 'Either name or caseNumber parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await SkipTraceEngine.searchCourt({
      name: name || undefined,
      caseNumber: caseNumber || undefined,
      state,
      courtType: type,
    });

    return NextResponse.json({
      success: true,
      data: {
        records: result.records,
        searchLinks: result.searchLinks,
        sources: result.sources,
      },
    });
  } catch (error) {
    console.error('Court search error:', error);
    return NextResponse.json(
      { error: 'Failed to search court records', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, caseNumber, state, courtType, searchType } = body;

    // Handle specific search types
    if (searchType === 'bankruptcy') {
      const result = await CourtRecords.searchBankruptcy(name, state);
      return NextResponse.json({
        success: true,
        data: {
          type: 'bankruptcy',
          records: result.records,
          searchUrls: result.searchUrls,
        },
      });
    }

    if (searchType === 'liens') {
      const result = await CourtRecords.searchLiensJudgments(name, state);
      return NextResponse.json({
        success: true,
        data: {
          type: 'liens_judgments',
          liens: result.liens,
          judgments: result.judgments,
          searchUrls: result.searchUrls,
        },
      });
    }

    if (searchType === 'ucc') {
      const result = await CourtRecords.searchUCC(name, state);
      return NextResponse.json({
        success: true,
        data: {
          type: 'ucc',
          filings: result.filings,
          searchUrls: result.searchUrls,
        },
      });
    }

    // General court search
    if (!name && !caseNumber) {
      return NextResponse.json(
        { error: 'Either name or caseNumber is required' },
        { status: 400 }
      );
    }

    const result = await SkipTraceEngine.searchCourt({
      name,
      caseNumber,
      state,
      courtType,
    });

    return NextResponse.json({
      success: true,
      data: {
        records: result.records,
        searchLinks: result.searchLinks,
        sources: result.sources,
      },
    });
  } catch (error) {
    console.error('Court search error:', error);
    return NextResponse.json(
      { error: 'Failed to search court records', details: String(error) },
      { status: 500 }
    );
  }
}
