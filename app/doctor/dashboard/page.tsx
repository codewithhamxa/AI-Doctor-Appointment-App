"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Video, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, Dr. {session?.user?.name}
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-lg">
            <Star className="h-5 w-5 text-yellow-600 fill-current" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Average Rating</div>
            <div className="text-xl font-bold text-gray-900">{avgRating} <span className="text-sm font-normal text-gray-500">({reviews.length} reviews)</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Manage Appointments
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No appointments found.
                </div>
              ) : (
                appointments.map((apt: any) => (
                  <div
                    key={apt._id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {apt.patientId?.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(apt.date), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {apt.timeSlot}
                          </span>
                        </div>
                        {apt.symptoms && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                            <span className="font-medium">Symptoms:</span>{" "}
                            {apt.symptoms}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {apt.status === "pending" ? (
                          <>
                            <button
                              onClick={() => updateStatus(apt._id, "accepted")}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium text-sm transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatus(apt._id, "rejected")}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium capitalize
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
                        )}

                        {apt.status === "accepted" && (
                          <>
                            <a
                              href={`https://meet.jit.si/MediAI-Consultation-${apt._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium text-sm transition-colors"
                            >
                              <Video className="h-4 w-4" />
                              Join Call
                            </a>
                            <button
                              onClick={() => updateStatus(apt._id, "completed")}
                              className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors"
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
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Patient Reviews
              </h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {reviews.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No reviews yet.
                </div>
              ) : (
                reviews.map((review: any) => (
                  <div key={review._id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">{review.patientId?.name}</div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {format(new Date(review.createdAt), "MMM dd, yyyy")}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 italic">&quot;{review.comment}&quot;</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
