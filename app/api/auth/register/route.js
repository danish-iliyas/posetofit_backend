import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request) {
  await connectToDatabase();
  const { email, password } = await request.json();

  if (!email || !password || password.length < 6) {
    return Response.json(
      { error: 'A valid email and a password of at least 6 characters are required' },
      { status: 400 }
    );
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  const token = signToken(user._id.toString());

  return Response.json(
    { token, user: { id: user._id, email: user.email, credits: user.credits } },
    { status: 201 }
  );
}
