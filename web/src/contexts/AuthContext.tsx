import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabaseClient";
import { Toaster, toast } from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData?: any
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, student_profile(*)")
        .eq("auth_user_id", userId)
        .single();
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      // If a dev role override is set, apply it on top of the fetched data.
      try {
        const override =
          typeof window !== "undefined"
            ? sessionStorage.getItem("devRoleOverride")
            : null;
        if (override) {
          return { ...data, role: override };
        }
      } catch (err) {
        // ignore sessionStorage errors
      }
      return data;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
      return profile;
    }
    return null;
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }, 0);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          setUserProfile(profile);
        });
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      console.log("[AuthContext] signUp called with:", {
        email,
        password,
        userData,
      });

      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // No userData (name) sent
        },
      });
      if (error) {
        toast.error(error.message || "Registration failed.");
        return { error };
      } else {
        // Check if a user profile with this email already exists
        const { data: existingUser, error: selectError } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();
        if (selectError && selectError.code !== "PGRST116") {
          // ignore no rows found
          toast.error(
            selectError.message || "Error checking existing profile."
          );
          return { error: selectError };
        }
        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
      }
      return { error };
    } catch (error: any) {
      toast.error(error.message || "Registration error.");
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message || "Login failed.");
      } else {
        toast.success("Welcome back! You have been successfully logged in.");
      }
      return { error };
    } catch (error: any) {
      toast.error(error.message || "Login error.");
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("You have been successfully logged out.");
    } catch (error: any) {
      toast.error(error.message || "Logout error.");
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      <Toaster position="bottom-right" />
      {children}
    </AuthContext.Provider>
  );
};
