import { NextRequest, NextResponse } from 'next/server';
import { PhoneEmail, SocialMedia } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'email parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await PhoneEmail.reverseEmail(email);
    const socialSearch = await SocialMedia.searchByEmail(email);

    return NextResponse.json({
      success: true,
      data: {
        parsed: result.parsed,
        searchUrls: result.searchUrls,
        verificationUrls: result.verificationUrls,
        socialSearchUrls: socialSearch.searchLinks,
      },
    });
  } catch (error) {
    console.error('Email lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup email', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, domain } = body;

    // If guessing emails for a person at a company
    if (firstName && lastName && domain) {
      const guessedEmails = PhoneEmail.guessEmails(firstName, lastName, domain);
      return NextResponse.json({
        success: true,
        data: {
          guessedEmails,
          verificationUrls: [
            { name: 'Hunter.io', url: 'https://hunter.io/email-verifier' },
            { name: 'NeverBounce', url: 'https://neverbounce.com/email-verification' },
          ],
        },
      });
    }

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    const result = await PhoneEmail.reverseEmail(email);
    const socialSearch = await SocialMedia.searchByEmail(email);

    return NextResponse.json({
      success: true,
      data: {
        parsed: result.parsed,
        searchUrls: result.searchUrls,
        verificationUrls: result.verificationUrls,
        socialSearchUrls: socialSearch.searchLinks,
      },
    });
  } catch (error) {
    console.error('Email lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup email', details: String(error) },
      { status: 500 }
    );
  }
}
