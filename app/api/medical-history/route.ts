import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MedicalHistory from '@/models/MedicalHistory';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'patient') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const history = await MedicalHistory.find({ patientId: session.user.id })
      .sort({ createdAt: -1 });
    
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
