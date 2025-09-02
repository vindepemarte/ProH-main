"use client";

import { useAppContext } from '@/contexts/app-context';
import Landing from '@/components/landing';
import Dashboard from '@/components/dashboard';
import AuthModal from '@/components/modals/auth-modal';
import ProfileModal from '@/components/modals/profile-modal';
import CookieConsent from '@/components/cookie-consent';

export default function Home() {
  const { user } = useAppContext();

  return (
    <>
      <div className="relative min-h-screen">
        {user ? <Dashboard /> : <Landing />}
      </div>
      <AuthModal />
      <ProfileModal />
      <CookieConsent />
    </>
  );
}
