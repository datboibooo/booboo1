import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    const result = await AISearch.searchCourt({
      name: name || undefined,
      caseNumber: caseNumber || undefined,
      state,
      courtType: type,
    });

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
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
    const { name, caseNumber, state, courtType } = body;

    if (!name && !caseNumber) {
      return NextResponse.json(
        { error: 'Either name or caseNumber is required' },
        { status: 400 }
      );
    }

    const result = await AISearch.searchCourt({
      name,
      caseNumber,
      state,
      courtType,
    });

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Court search error:', error);
    return NextResponse.json(
      { error: 'Failed to search court records', details: String(error) },
      { status: 500 }
    );
  }
}
