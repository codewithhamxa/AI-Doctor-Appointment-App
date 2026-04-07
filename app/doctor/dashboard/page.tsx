"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Video, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "doctor") {
      router.push("/patient/dashboard");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, session]);

  const fetchData = async () => {
    try {
      const [apptsRes, reviewsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch(`/api/reviews?doctorId=${session?.user?.id}`)
      ]);
      const apptsData = await apptsRes.json();
      const reviewsData = await reviewsRes.json();
      setAppointments(apptsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc: number, rev: any) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100 hidden md:block">
          <h2 className="text-xl font-bold text-gray-900">Doctor Panel</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">Dr. {session?.user?.name}</p>
        </div>
        
        {/* Rating Badge in Sidebar */}
        <div className="px-6 py-4 border-b border-gray-100 hidden md:block bg-gray-50/50">
          <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Overall Rating</div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            <span className="text-lg font-bold text-gray-900">{avgRating}</span>
            <span className="text-sm text-gray-500">({reviews.length})</span>
          </div>
        </div>

        <nav className="flex md:flex-col p-2 md:p-4 gap-2 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-3 whitespace-nowrap p-3 rounded-xl text-left transition-colors ${
              activeTab === "appointments" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Manage Appointments</span>
            <span className="md:hidden">Appointments</span>
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-3 whitespace-nowrap p-3 rounded-xl text-left transition-colors ${
              activeTab === "reviews" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Patient Reviews</span>
            <span className="md:hidden">Reviews</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {activeTab === "appointments" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Manage Appointments
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {appointments.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No appointments found.</p>
                  </div>
                ) : (
                  appointments.map((apt: any) => (
                    <div
                      key={apt._id}
                      className="p-6 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {apt.patientId?.name}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize tracking-wide
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
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              {format(new Date(apt.date), "MMM dd, yyyy")}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm">
                              <Clock className="h-4 w-4 text-blue-500" />
                              {apt.timeSlot}
                            </span>
                          </div>
                          {apt.symptoms && (
                            <div className="mt-3 text-sm text-gray-700 bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                              <span className="font-semibold text-blue-900 block mb-1">Reported Symptoms:</span>
                              {apt.symptoms}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                          {apt.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(apt._id, "accepted")}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-xl font-medium text-sm transition-colors shadow-sm"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Accept
                              </button>
                              <button
                                onClick={() => updateStatus(apt._id, "rejected")}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}

                          {apt.status === "accepted" && (
                            <>
                              <a
                                href={`https://meet.jit.si/MediAI-Consultation-${apt._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-medium text-sm transition-colors shadow-sm"
                              >
                                <Video className="h-4 w-4" />
                                Join Call
                              </a>
                              <button
                                onClick={() => updateStatus(apt._id, "completed")}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium text-sm transition-colors"
                              >
                                Mark Completed
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  Patient Reviews
                </h2>
                <div className="md:hidden flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                   <Star className="h-4 w-4 text-yellow-500 fill-current" />
                   <span className="font-bold text-sm">{avgRating}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {reviews.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No reviews yet.</p>
                  </div>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review._id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-gray-900">{review.patientId?.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(review.createdAt), "MMMM dd, yyyy")}
                          </div>
                        </div>
                        <div className="flex gap-0.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <div className="text-sm text-gray-700 bg-white border border-gray-100 p-4 rounded-xl italic shadow-sm">
                          &quot;{review.comment}&quot;
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
    </div>
  );
}
