import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const state = request.nextUrl.searchParams.get('state') || undefined;

  // Parse name for person address history
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
    const result = await AISearch.searchAddressHistory(first, last, state);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Address history error:', error);
    return NextResponse.json(
      { error: 'Failed to search address history', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, name, state } = body;

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
        { error: 'firstName and lastName are required' },
        { status: 400 }
      );
    }

    const result = await AISearch.searchAddressHistory(first, last, state);

    return NextResponse.json({
      success: true,
      data: result,
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Address history error:', error);
    return NextResponse.json(
      { error: 'Failed to search address history', details: String(error) },
      { status: 500 }
    );
  }
}
