import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');

  if (!phone) {
    return NextResponse.json(
      { error: 'phone parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await AISearch.lookupPhone(phone);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Phone lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup phone', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      );
    }

    const result = await AISearch.lookupPhone(phone);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Phone lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup phone', details: String(error) },
      { status: 500 }
    );
  }
}
