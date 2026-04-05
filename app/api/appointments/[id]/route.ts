import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import Notification from "@/models/Notification";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "doctor") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    const { id } = await params;

    await dbConnect();

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctorId: session.user.id },
      { status },
      { new: true },
    );

    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 },
      );
    }

    // Create notification for patient
    let message = '';
    if (status === 'accepted') message = `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot} has been accepted.`;
    else if (status === 'rejected') message = `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot} has been rejected.`;
    else if (status === 'completed') message = `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot} has been marked as completed.`;

    if (message) {
      await Notification.create({
        userId: appointment.patientId,
        message
      });
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
