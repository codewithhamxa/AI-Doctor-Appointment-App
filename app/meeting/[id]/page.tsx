"use client";

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MeetingPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status !== 'authenticated' || !containerRef.current || apiLoaded) return;

    const domain = 'meet.jit.si';
    
    // Load the Jitsi external API script
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => {
      setApiLoaded(true);
      if ((window as any).JitsiMeetExternalAPI) {
        const options = {
          roomName: `MediAI-Consultation-${params.id}`,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: session.user?.name || (session.user?.role === 'doctor' ? 'Doctor' : 'Patient')
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
        };

        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        
        api.addListener('videoConferenceLeft', () => {
          router.push(session.user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [session, status, params.id, router, apiLoaded]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col">
      <div className="p-4 bg-gray-800 text-white flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-lg font-bold">MediAI Consultation</h1>
        </div>
        <button 
          onClick={() => router.push(session?.user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          Leave Meeting
        </button>
      </div>
      <div ref={containerRef} className="flex-1 w-full h-full bg-black" />
    </div>
  );
}
