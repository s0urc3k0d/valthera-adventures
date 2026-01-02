import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Character, Quest } from '@/lib/models';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache pendant 60 secondes

export async function GET() {
  try {
    await connectDB();

    // Statistiques globales
    const [
      totalPlayers,
      totalCombats,
      totalQuests,
      totalZonesExplored,
    ] = await Promise.all([
      Character.countDocuments(),
      Character.aggregate([
        { $group: { _id: null, total: { $sum: '$statistics.monstersKilled' } } },
      ]).then((res) => res[0]?.total || 0),
      Quest.countDocuments({ status: 'completed' }),
      Character.aggregate([
        { $group: { _id: null, total: { $sum: '$statistics.zonesExplored' } } },
      ]).then((res) => res[0]?.total || 0),
    ]);

    return NextResponse.json({
      totalPlayers,
      totalCombats,
      totalQuests,
      totalZonesExplored,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
