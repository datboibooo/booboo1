import { NextRequest, NextResponse } from 'next/server';
import { PhoneEmail } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');

  if (!phone) {
    return NextResponse.json(
      { error: 'phone parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await PhoneEmail.reversePhone(phone);

    // Get carrier info
    const carrierInfo = await PhoneEmail.lookupCarrier(phone);

    // Check DNC status
    const dncStatus = await PhoneEmail.checkDoNotCall(phone);

    return NextResponse.json({
      success: true,
      data: {
        parsed: result.parsed,
        location: result.location,
        carrier: carrierInfo,
        doNotCall: dncStatus,
        searchUrls: result.searchUrls,
      },
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

    const result = await PhoneEmail.reversePhone(phone);
    const carrierInfo = await PhoneEmail.lookupCarrier(phone);
    const dncStatus = await PhoneEmail.checkDoNotCall(phone);

    return NextResponse.json({
      success: true,
      data: {
        parsed: result.parsed,
        location: result.location,
        carrier: carrierInfo,
        doNotCall: dncStatus,
        searchUrls: result.searchUrls,
      },
    });
  } catch (error) {
    console.error('Phone lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup phone', details: String(error) },
      { status: 500 }
    );
  }
}
