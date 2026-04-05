import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let appointments;
    if (session.user.role === "patient") {
      appointments = await Appointment.find({ patientId: session.user.id })
        .populate("doctorId", "name specialty email")
        .sort({ date: 1 });
    } else {
      appointments = await Appointment.find({ doctorId: session.user.id })
        .populate("patientId", "name email")
        .sort({ date: 1 });
    }

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "patient") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { doctorId, date, timeSlot, symptoms } = await req.json();

    await dbConnect();

    const appointment = await Appointment.create({
      patientId: session.user.id,
      doctorId,
      date,
      timeSlot,
      symptoms,
      status: "pending",
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
