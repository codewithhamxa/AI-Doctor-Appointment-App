import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const doctors = await User.find({ role: "doctor" }).select("-password");

    return NextResponse.json(doctors);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
