"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AIChat from "@/components/AIChat";
import { Calendar, Clock, User as UserIcon, Loader2, Video, Star, FileText, History, Bot } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("appointments");
  
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100 hidden md:block">
          <h2 className="text-xl font-bold text-gray-900">Patient Panel</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">{session?.user?.name}</p>
        </div>
        <nav className="flex md:flex-col p-2 md:p-4 gap-2 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-3 whitespace-nowrap p-3 rounded-xl text-left transition-colors ${
              activeTab === "appointments" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Clock className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">My Appointments</span>
            <span className="md:hidden">Appointments</span>
          </button>
          <button
            onClick={() => setActiveTab("book")}
            className={`flex items-center gap-3 whitespace-nowrap p-3 rounded-xl text-left transition-colors ${
              activeTab === "book" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Book Appointment</span>
            <span className="md:hidden">Book</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-3 whitespace-nowrap p-3 rounded-xl text-left transition-colors ${
              activeTab === "chat" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Bot className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">AI Assistant</span>
            <span className="md:hidden">AI Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-3 whitespace-nowrap p-3 rounded-xl text-left transition-colors ${
              activeTab === "history" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <History className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Medical History</span>
            <span className="md:hidden">History</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {activeTab === "appointments" && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                My Appointments
              </h2>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No appointments found.
                  </p>
                ) : (
                  appointments.map((apt: any) => (
                    <div
                      key={apt._id}
                      className="p-5 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white transition-colors shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-gray-900 text-lg">
                          Dr. {apt.doctorId?.name}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize tracking-wide
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div className="text-sm text-gray-600 flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          {format(new Date(apt.date), "MMMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {apt.timeSlot}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {apt.status === "accepted" && (
                          <a
                            href={`https://meet.jit.si/MediAI-Consultation-${apt._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors shadow-sm"
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
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 rounded-lg font-medium text-sm transition-colors"
                          >
                            <Star className="h-4 w-4" />
                            Rate Doctor
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "book" && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Book a New Appointment
              </h2>
              <form onSubmit={handleBookAppointment} className="space-y-5 max-w-2xl">
                {bookingError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    {bookingError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Select Doctor
                    </label>
                    <select
                      required
                      value={bookingData.doctorId}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, doctorId: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 hover:bg-white transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Time Slot
                    </label>
                    <select
                      required
                      value={bookingData.timeSlot}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, timeSlot: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 hover:bg-white transition-colors"
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Symptoms (Optional)
                    </label>
                    <textarea
                      value={bookingData.symptoms}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, symptoms: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none bg-gray-50 hover:bg-white transition-colors"
                      rows={3}
                      placeholder="Briefly describe your symptoms..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                >
                  {bookingLoading ? "Booking Appointment..." : "Confirm Booking"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="h-[calc(100vh-12rem)] min-h-[600px]">
              <AIChat />
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <History className="h-6 w-6 text-blue-600" />
                AI Medical History
              </h2>
              <div className="space-y-4">
                {medicalHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No medical history found. Use the AI Assistant to generate reports.
                  </p>
                ) : (
                  medicalHistory.map((history: any) => (
                    <div key={history._id} className="p-5 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          <FileText className="h-4 w-4" />
                          AI Report
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                          {format(new Date(history.createdAt), "MMM dd, yyyy h:mm a")}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-4 mb-3 bg-white p-4 rounded-lg border border-gray-100">
                        {history.reportText}
                      </div>
                      {history.prescriptionFile && (
                        <div className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
                          <FileText className="h-3 w-3" />
                          Contains uploaded prescription
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rate your Doctor</h3>
            <form onSubmit={submitReview} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2 bg-gray-50 p-3 rounded-xl justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`p-1 transition-transform hover:scale-110 ${reviewData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-10 w-10 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review (Optional)</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none bg-gray-50 hover:bg-white transition-colors"
                  rows={4}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
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
