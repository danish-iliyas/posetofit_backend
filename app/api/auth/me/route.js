import { connectToDatabase } from '@/lib/mongodb';
import { getUserIdFromRequest } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request) {
  await connectToDatabase();
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({ user: { id: user._id, email: user.email, credits: user.credits } });
}
