import { connectToDatabase } from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function PATCH(request, { params }) {
  await connectToDatabase();
  const { id } = await params;
  const updates = await request.json();

  const profile = await Profile.findByIdAndUpdate(id, updates, {
    new: true,
    returnDocument: 'after',
  });

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  return Response.json({ profile });
}

export async function DELETE(request, { params }) {
  await connectToDatabase();
  const { id } = await params;

  const profile = await Profile.findByIdAndDelete(id);
  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  return Response.json({ ok: true });
}
