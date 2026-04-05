"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AIChat from "@/components/AIChat";
import { Calendar, Clock, User as UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    doctorId: "",
    date: "",
    timeSlot: "",
    symptoms: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "patient"
    ) {
      router.push("/doctor/dashboard");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, session]);

  const fetchData = async () => {
    try {
      const [docsRes, apptsRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/appointments"),
      ]);
      const docs = await docsRes.json();
      const appts = await apptsRes.json();
      setDoctors(docs);
      setAppointments(appts);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        setBookingData({ doctorId: "", date: "", timeSlot: "", symptoms: "" });
        fetchData(); // Refresh appointments
      }
    } catch (error) {
      console.error("Failed to book appointment", error);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Booking & Appointments */}
        <div className="lg:col-span-1 space-y-8">
          {/* Book Appointment Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Book Appointment
            </h2>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor
                </label>
                <select
                  required
                  value={bookingData.doctorId}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, doctorId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doc: any) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={bookingData.date}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Slot
                </label>
                <select
                  required
                  value={bookingData.timeSlot}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, timeSlot: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Choose a time...</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms (Optional)
                </label>
                <textarea
                  value={bookingData.symptoms}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, symptoms: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                  rows={2}
                  placeholder="Briefly describe your symptoms..."
                />
              </div>
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {bookingLoading ? "Booking..." : "Book Appointment"}
              </button>
            </form>
          </div>

          {/* My Appointments Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              My Appointments
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No appointments found.
                </p>
              ) : (
                appointments.map((apt: any) => (
                  <div
                    key={apt._id}
                    className="p-4 border border-gray-100 rounded-xl bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        Dr. {apt.doctorId?.name}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${
                          apt.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : apt.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : apt.status === "completed"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(apt.date), "MMM dd, yyyy")}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {apt.timeSlot}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Chat */}
        <div className="lg:col-span-2">
          <AIChat />
        </div>
      </div>
    </div>
  );
}
