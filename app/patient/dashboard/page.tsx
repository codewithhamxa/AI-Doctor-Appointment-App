"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AIChat from "@/components/AIChat";
import { Calendar, Clock, User as UserIcon, Loader2, Video, Star, FileText, History } from "lucide-react";
import { format } from "date-fns";

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    doctorId: "",
    date: "",
    timeSlot: "",
    symptoms: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  
  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });

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
      const [docsRes, apptsRes, historyRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/appointments"),
        fetch("/api/medical-history")
      ]);
      const docs = await docsRes.json();
      const appts = await apptsRes.json();
      const history = await historyRes.json();
      setDoctors(docs);
      setAppointments(appts);
      setMedicalHistory(history);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        setBookingData({ doctorId: "", date: "", timeSlot: "", symptoms: "" });
        fetchData(); // Refresh appointments
      } else {
        const data = await res.json();
        setBookingError(data.message);
      }
    } catch (error) {
      console.error("Failed to book appointment", error);
      setBookingError("An error occurred while booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: selectedDoctorId, ...reviewData }),
      });
      if (res.ok) {
        setReviewModalOpen(false);
        setReviewData({ rating: 5, comment: "" });
        fetchData(); // Refresh doctors to update ratings
      }
    } catch (error) {
      console.error("Failed to submit review", error);
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
              {bookingError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {bookingError}
                </div>
              )}
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
                      Dr. {doc.name} - {doc.specialty} {doc.avgRating > 0 ? `(⭐ ${doc.avgRating})` : ''}
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
                    {apt.status === "accepted" && (
                      <a
                        href={`https://meet.jit.si/MediAI-Consultation-${apt._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors w-full"
                      >
                        <Video className="h-4 w-4" />
                        Join Video Call
                      </a>
                    )}
                    {apt.status === "completed" && (
                      <button
                        onClick={() => {
                          setSelectedDoctorId(apt.doctorId._id);
                          setReviewModalOpen(true);
                        }}
                        className="mt-3 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg font-medium text-sm transition-colors w-full"
                      >
                        <Star className="h-4 w-4" />
                        Rate Doctor
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Chat & Medical History */}
        <div className="lg:col-span-2 space-y-8">
          <AIChat />

          {/* Medical History */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              AI Medical History
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {medicalHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No medical history found. Use the AI Assistant to generate reports.
                </p>
              ) : (
                medicalHistory.map((history: any) => (
                  <div key={history._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        AI Report
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(history.createdAt), "MMM dd, yyyy h:mm a")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-3 mb-2">
                      {history.reportText}
                    </div>
                    {history.prescriptionFile && (
                      <div className="text-xs text-blue-600 font-medium">
                        Contains uploaded prescription
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate your Doctor</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`p-1 ${reviewData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review (Optional)</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
