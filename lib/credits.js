import User from '@/models/User';

export async function requireCredits(userId, amount = 1) {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  if (user.credits < amount) {
    throw Object.assign(new Error('Out of credits'), { status: 402 });
  }
  return user;
}

export async function deductCredits(userId, amount = 1) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { credits: -amount } },
    { new: true }
  );
  return user.credits;
}
