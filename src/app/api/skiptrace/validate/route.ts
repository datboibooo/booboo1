import { NextRequest, NextResponse } from 'next/server';
import { DataValidation } from '@/lib/skiptrace/sources/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, address, city, state, zip } = body;

    switch (type) {
      case 'email':
        if (!value) {
          return NextResponse.json(
            { error: 'Email address is required' },
            { status: 400 }
          );
        }
        const emailResult = DataValidation.validateEmail(value);
        return NextResponse.json({
          success: true,
          type: 'email',
          data: emailResult,
        });

      case 'phone':
        if (!value) {
          return NextResponse.json(
            { error: 'Phone number is required' },
            { status: 400 }
          );
        }
        const phoneResult = DataValidation.validatePhone(value);
        return NextResponse.json({
          success: true,
          type: 'phone',
          data: phoneResult,
        });

      case 'address':
        if (!address || !city || !state) {
          return NextResponse.json(
            { error: 'Address, city, and state are required' },
            { status: 400 }
          );
        }
        const addressResult = DataValidation.validateAddress(address, city, state, zip || '');
        return NextResponse.json({
          success: true,
          type: 'address',
          data: addressResult,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid validation type. Use: email, phone, or address' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const value = request.nextUrl.searchParams.get('value');
  const address = request.nextUrl.searchParams.get('address');
  const city = request.nextUrl.searchParams.get('city');
  const state = request.nextUrl.searchParams.get('state');
  const zip = request.nextUrl.searchParams.get('zip');

  if (!type) {
    return NextResponse.json(
      { error: 'Validation type is required (email, phone, or address)' },
      { status: 400 }
    );
  }

  switch (type) {
    case 'email':
      if (!value) {
        return NextResponse.json(
          { error: 'Email address is required (value param)' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        type: 'email',
        data: DataValidation.validateEmail(value),
      });

    case 'phone':
      if (!value) {
        return NextResponse.json(
          { error: 'Phone number is required (value param)' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        type: 'phone',
        data: DataValidation.validatePhone(value),
      });

    case 'address':
      if (!address || !city || !state) {
        return NextResponse.json(
          { error: 'Address, city, and state params are required' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        type: 'address',
        data: DataValidation.validateAddress(address, city, state, zip || ''),
      });

    default:
      return NextResponse.json(
        { error: 'Invalid validation type. Use: email, phone, or address' },
        { status: 400 }
      );
  }
}
