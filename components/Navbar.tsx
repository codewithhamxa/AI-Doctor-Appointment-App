"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Stethoscope, LogOut, User as UserIcon, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Navbar() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    if (session) {
      fetchNotifications();
    }
  }, [session]);

  const markAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(notifications.map((n: any) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                MediAI
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href={
                    session.user?.role === "doctor"
                      ? "/doctor/dashboard"
                      : "/patient/dashboard"
                  }
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) {
                        markAsRead();
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No notifications yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notif: any) => (
                              <div key={notif._id} className={`p-4 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                                <p className="text-sm text-gray-800">{notif.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
