"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (!cookieConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    hideBanner();
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    // Clear any existing cookies (except essential ones)
    clearNonEssentialCookies();
    hideBanner();
  };

  const hideBanner = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300); // Allow animation to complete
  };

  const clearNonEssentialCookies = () => {
    // Clear all cookies except essential ones
    const cookies = document.cookie.split(";");
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Keep essential cookies (authentication, etc.)
      const essentialCookies = ['prohappy_user', 'auth_token'];
      if (!essentialCookies.includes(name)) {
        // Delete the cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;
      }
    });
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={hideBanner}
      />
      
      {/* Cookie Banner */}
      <div 
        className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 transition-all duration-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <Card className="shadow-2xl border-2">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2">We Use Cookies</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    We use cookies to enhance your experience, analyze site usage, and improve our services. 
                    You can accept all cookies or reject non-essential ones.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleAccept}
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Accept All
                  </Button>
                  <Button 
                    onClick={handleReject}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Reject Non-Essential
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  By continuing to use our site, you agree to our use of essential cookies for functionality.
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={hideBanner}
                className="p-1 h-auto flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}