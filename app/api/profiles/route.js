import { connectToDatabase } from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET(request) {
  await connectToDatabase();
  const deviceId = request.nextUrl.searchParams.get('deviceId');
  if (!deviceId) {
    return Response.json({ error: 'Missing deviceId' }, { status: 400 });
  }

  const profiles = await Profile.find({ deviceId }).sort({ createdAt: 1 });
  return Response.json({ profiles });
}

export async function POST(request) {
  await connectToDatabase();
  const body = await request.json();
  const { deviceId, name, gender, heightCm } = body;

  if (!deviceId || !name || !gender || !heightCm) {
    return Response.json(
      { error: 'deviceId, name, gender and heightCm are required' },
      { status: 400 }
    );
  }

  const profile = await Profile.create({ deviceId, name, gender, heightCm });
  return Response.json({ profile }, { status: 201 });
}
