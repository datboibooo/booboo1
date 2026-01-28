import { NextRequest, NextResponse } from 'next/server';
import { AISearch } from '@/lib/skiptrace/ai-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const firstName = request.nextUrl.searchParams.get('firstName');
  const lastName = request.nextUrl.searchParams.get('lastName');
  const name = request.nextUrl.searchParams.get('name');
  const location = request.nextUrl.searchParams.get('location') || undefined;

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
      { error: 'firstName and lastName (or name) parameters are required' },
      { status: 400 }
    );
  }

  try {
    const result = await AISearch.searchSocial(first, last, location);

    return NextResponse.json({
      success: true,
      data: {
        searchType: 'person',
        name: `${first} ${last}`,
        ...result,
      },
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
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
    const { firstName, lastName, name, location } = body;

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

    const result = await AISearch.searchSocial(first, last, location);

    return NextResponse.json({
      success: true,
      data: {
        searchType: 'person',
        name: `${first} ${last}`,
        ...result,
      },
      source: 'AI: Vercel AI SDK with OpenAI/Anthropic support',
    });
  } catch (error) {
    console.error('Social search error:', error);
    return NextResponse.json(
      { error: 'Failed to search social profiles', details: String(error) },
      { status: 500 }
    );
  }
}
