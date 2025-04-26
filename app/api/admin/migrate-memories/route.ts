import { migrateMemoriesToDedicatedTable } from '@/lib/db/migrations/migrate-memories';
import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';

/**
 * Admin API route to migrate memories from document table to memory table
 * This should be called with a secret key for security
 */
export async function POST(request: Request) {
  const session = await auth();

  // Check authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check for admin authorization - you would implement proper authorization
  // This is just a simple example
  const { searchParams } = new URL(request.url);
  const secretKey = searchParams.get('key');

  if (secretKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    // Run migration
    await migrateMemoriesToDedicatedTable();

    return NextResponse.json({
      success: true,
      message: 'Memory migration completed successfully',
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Failed to run migration', details: String(error) },
      { status: 500 },
    );
  }
}
