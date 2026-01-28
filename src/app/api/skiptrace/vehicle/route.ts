import { NextRequest, NextResponse } from 'next/server';
import { VehicleRecords, SkipTraceEngine } from '@/lib/skiptrace';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get('vin');
  const ownerName = request.nextUrl.searchParams.get('owner');
  const state = request.nextUrl.searchParams.get('state') || undefined;

  if (!vin && !ownerName) {
    return NextResponse.json(
      { error: 'Either vin or owner parameter is required' },
      { status: 400 }
    );
  }

  try {
    if (vin) {
      // Validate VIN
      if (!VehicleRecords.isValidVIN(vin)) {
        return NextResponse.json(
          { error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' },
          { status: 400 }
        );
      }

      // Full VIN lookup
      const result = await SkipTraceEngine.lookupVIN(vin);

      return NextResponse.json({
        success: true,
        data: {
          vin,
          vinParsed: VehicleRecords.parseVIN(vin),
          decoded: result.decoded,
          recalls: result.recalls,
          complaints: result.complaints,
        },
      });
    }

    if (ownerName) {
      const result = await VehicleRecords.searchByOwner(ownerName, state);
      return NextResponse.json({
        success: true,
        data: {
          owner: ownerName,
          state,
          vehicles: result.vehicles,
          searchUrls: result.searchUrls,
        },
      });
    }
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vehicle', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin, ownerName, state, licensePlate } = body;

    if (vin) {
      if (!VehicleRecords.isValidVIN(vin)) {
        return NextResponse.json(
          { error: 'Invalid VIN format' },
          { status: 400 }
        );
      }

      const result = await SkipTraceEngine.lookupVIN(vin);

      return NextResponse.json({
        success: true,
        data: {
          vin,
          vinParsed: VehicleRecords.parseVIN(vin),
          decoded: result.decoded,
          recalls: result.recalls,
          complaints: result.complaints,
        },
      });
    }

    if (licensePlate && state) {
      const lookupUrls = VehicleRecords.getLicensePlateLookup(licensePlate, state);
      return NextResponse.json({
        success: true,
        data: {
          licensePlate,
          state,
          searchUrls: lookupUrls,
          dmvInfo: VehicleRecords.getDMVInfo(state),
        },
      });
    }

    if (ownerName) {
      const result = await VehicleRecords.searchByOwner(ownerName, state);
      return NextResponse.json({
        success: true,
        data: {
          owner: ownerName,
          state,
          vehicles: result.vehicles,
          searchUrls: result.searchUrls,
        },
      });
    }

    return NextResponse.json(
      { error: 'At least one search parameter is required (vin, licensePlate, or ownerName)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vehicle', details: String(error) },
      { status: 500 }
    );
  }
}
