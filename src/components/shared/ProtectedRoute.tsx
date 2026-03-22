"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/login");
      } else if (
        userData &&
        allowedRoles &&
        !allowedRoles.includes(userData.role)
      ) {
        // Redirect if user doesn't have required role
        router.push("/dashboard"); // Or an unauthorized page
      }
    }
  }, [user, userData, loading, router, allowedRoles, pathname]);

  if (loading || !user || (allowedRoles && userData && !allowedRoles.includes(userData.role))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#030712] z-50">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
