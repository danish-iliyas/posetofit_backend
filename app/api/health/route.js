import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const connection = await connectToDatabase();
    return Response.json({
      status: 'ok',
      database: connection.connection.name,
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
