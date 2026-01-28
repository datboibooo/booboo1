import { NextRequest, NextResponse } from 'next/server';
import { PublicRecords } from '@/lib/skiptrace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  const state = request.nextUrl.searchParams.get('state') || undefined;
  const type = request.nextUrl.searchParams.get('type') || 'all';

  if (!name) {
    return NextResponse.json(
      { error: 'name parameter is required' },
      { status: 400 }
    );
  }

  try {
    const results: Record<string, unknown> = {};

    switch (type) {
      case 'ssdi':
      case 'death':
        results.ssdiUrls = PublicRecords.getSSDIUrls(name);
        break;

      case 'voter':
        if (state) {
          results.voterSearch = PublicRecords.getVoterSearchUrl(state);
        }
        break;

      case 'vital':
        if (state) {
          results.vitalRecords = PublicRecords.getVitalRecordsUrl(state);
        }
        break;

      case 'marriage':
        if (state) {
          results.marriageDivorce = PublicRecords.getMarriageDivorceUrls(state);
        }
        break;

      case 'census':
        results.censusUrls = PublicRecords.getCensusRecordUrls(name);
        break;

      case 'military':
        results.militaryUrls = PublicRecords.getMilitaryRecordUrls(name);
        break;

      case 'immigration':
        results.immigrationUrls = PublicRecords.getImmigrationRecordUrls(name);
        break;

      default:
        // All record types
        results.ssdiUrls = PublicRecords.getSSDIUrls(name);
        results.censusUrls = PublicRecords.getCensusRecordUrls(name);
        results.militaryUrls = PublicRecords.getMilitaryRecordUrls(name);
        results.immigrationUrls = PublicRecords.getImmigrationRecordUrls(name);
        results.aggregators = PublicRecords.getAggregators();

        if (state) {
          results.vitalRecords = PublicRecords.getVitalRecordsUrl(state);
          results.voterSearch = PublicRecords.getVoterSearchUrl(state);
          results.marriageDivorce = PublicRecords.getMarriageDivorceUrls(state);
        }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Public records search error:', error);
    return NextResponse.json(
      { error: 'Failed to search public records', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, state, recordType } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {};

    switch (recordType) {
      case 'ssdi':
        results.type = 'ssdi';
        results.searchUrls = PublicRecords.getSSDIUrls(name);
        break;

      case 'voter':
        results.type = 'voter';
        if (state) {
          results.searchUrls = [PublicRecords.getVoterSearchUrl(state)];
        }
        break;

      case 'vital':
        results.type = 'vital';
        if (state) {
          results.searchUrls = [PublicRecords.getVitalRecordsUrl(state)];
        }
        break;

      case 'census':
        results.type = 'census';
        results.searchUrls = PublicRecords.getCensusRecordUrls(name);
        break;

      case 'military':
        results.type = 'military';
        results.searchUrls = PublicRecords.getMilitaryRecordUrls(name);
        break;

      case 'immigration':
        results.type = 'immigration';
        results.searchUrls = PublicRecords.getImmigrationRecordUrls(name);
        break;

      default:
        // Comprehensive public records search
        results.ssdi = PublicRecords.getSSDIUrls(name);
        results.census = PublicRecords.getCensusRecordUrls(name);
        results.military = PublicRecords.getMilitaryRecordUrls(name);
        results.immigration = PublicRecords.getImmigrationRecordUrls(name);
        results.aggregators = PublicRecords.getAggregators();

        if (state) {
          results.vital = PublicRecords.getVitalRecordsUrl(state);
          results.voter = PublicRecords.getVoterSearchUrl(state);
          results.marriage = PublicRecords.getMarriageDivorceUrls(state);
          results.birth = PublicRecords.getBirthRecordUrls(state);
        }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Public records search error:', error);
    return NextResponse.json(
      { error: 'Failed to search public records', details: String(error) },
      { status: 500 }
    );
  }
}
