import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Review from "@/models/Review";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const doctors = await User.find({ role: "doctor" }).select("-password").lean();

    // Fetch average ratings for each doctor
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        const reviews = await Review.find({ doctorId: doctor._id });
        const avgRating = reviews.length > 0 
          ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length 
          : 0;
        
        return {
          ...doctor,
          avgRating: avgRating.toFixed(1),
          reviewCount: reviews.length
        };
      })
    );

    return NextResponse.json(doctorsWithRatings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
