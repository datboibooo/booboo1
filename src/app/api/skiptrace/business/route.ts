import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';
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

    const results = await AISearch.searchBusiness(params);

    return NextResponse.json({
      success: true,
      data: results,
      query: params,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
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

  if (!name) {
    return NextResponse.json(
      { error: 'name parameter is required' },
      { status: 400 }
    );
  }

  try {
    const results = await AISearch.searchBusiness({ name, state });

    return NextResponse.json({
      success: true,
      data: results,
      query: { name, state },
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Business search error:', error);
    return NextResponse.json(
      { error: 'Failed to search business', details: String(error) },
      { status: 500 }
    );
  }
}
