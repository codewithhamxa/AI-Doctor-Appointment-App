import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'patient') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { doctorId, rating, comment } = await req.json();

    await dbConnect();
    
    const review = await Review.create({
      patientId: session.user.id,
      doctorId,
      rating,
      comment
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json({ message: 'Doctor ID required' }, { status: 400 });
    }

    await dbConnect();
    
    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
