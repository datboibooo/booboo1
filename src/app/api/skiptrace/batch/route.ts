import { NextRequest, NextResponse } from 'next/server';
import { SkipTraceEngine } from '@/lib/skiptrace';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for batch processing

interface BatchSearchItem {
  type: 'person' | 'business' | 'phone' | 'email';
  params: Record<string, string>;
}

interface BatchResult {
  index: number;
  type: string;
  params: Record<string, string>;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
  duration: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, mode = 'quick' } = body as { items: BatchSearchItem[]; mode?: string };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 items per batch' },
        { status: 400 }
      );
    }

    const results: BatchResult[] = [];
    const startTime = Date.now();

    // Process items with concurrency limit
    const concurrencyLimit = 5;
    const queue = [...items.map((item, index) => ({ ...item, index }))];

    const processItem = async (item: BatchSearchItem & { index: number }): Promise<BatchResult> => {
      const itemStart = Date.now();

      try {
        let data: unknown;

        switch (item.type) {
          case 'person':
            data = await SkipTraceEngine.searchPerson(
              {
                firstName: item.params.firstName,
                lastName: item.params.lastName,
                city: item.params.city,
                state: item.params.state,
                phone: item.params.phone,
                email: item.params.email,
              },
              mode as 'quick' | 'standard' | 'deep'
            );
            break;

          case 'business':
            data = await SkipTraceEngine.searchBusiness(
              {
                name: item.params.name,
                state: item.params.state,
              },
              mode as 'quick' | 'standard' | 'deep'
            );
            break;

          case 'phone':
            data = await SkipTraceEngine.quickPhoneLookup(item.params.phone);
            break;

          case 'email':
            data = await SkipTraceEngine.quickEmailLookup(item.params.email);
            break;

          default:
            throw new Error(`Unknown search type: ${item.type}`);
        }

        return {
          index: item.index,
          type: item.type,
          params: item.params,
          status: 'success',
          data,
          duration: Date.now() - itemStart,
        };
      } catch (error) {
        return {
          index: item.index,
          type: item.type,
          params: item.params,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - itemStart,
        };
      }
    };

    // Process in batches with concurrency limit
    while (queue.length > 0) {
      const batch = queue.splice(0, concurrencyLimit);
      const batchResults = await Promise.all(batch.map(processItem));
      results.push(...batchResults);
    }

    // Sort results by original index
    results.sort((a, b) => a.index - b.index);

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: items.length,
        success: successCount,
        errors: errorCount,
        duration: Date.now() - startTime,
      },
      results,
    });
  } catch (error) {
    console.error('Batch search error:', error);
    return NextResponse.json(
      { error: 'Batch search failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Get batch processing status (for future async implementation)
export async function GET(request: NextRequest) {
  const batchId = request.nextUrl.searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json(
      { error: 'batchId parameter is required' },
      { status: 400 }
    );
  }

  // For now, return not found (batch processing is synchronous)
  return NextResponse.json(
    { error: 'Batch not found or already completed' },
    { status: 404 }
  );
}
