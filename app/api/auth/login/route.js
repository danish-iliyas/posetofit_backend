import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request) {
  await connectToDatabase();
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = signToken(user._id.toString());
  return Response.json({ token, user: { id: user._id, email: user.email, credits: user.credits } });
}
