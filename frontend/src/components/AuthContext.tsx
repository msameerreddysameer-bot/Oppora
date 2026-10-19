import api from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";






interface IUser {
    _id?: string;
    email?: string;
    FullName?: string;
    fullName?: string;
    name?: string;
    role?: 'admin' | 'student' | 'user' | string;
    college?: string;
    university?: string;
    branch?: string;
    year?: string;
    skills?: string[];
    interests?: string[];
    avatar?: string | { url?: string };
    avatarUrl?: string;
    profilePicture?: string;
    isEmailVerified?: boolean;
}
interface AuthContextType {
    user:IUser | null ;
    isAuthenticated:boolean;
    isLoading:boolean;
    refreshAuth:() => Promise<IUser | null>;
    refreshAccessToken:() => Promise<boolean>;
    logout:() => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children,}:{children:React.ReactNode}){

    const [user,setUser] = useState<IUser | null>(null)

    const [isLoading , setIsLoading] = useState(true)

    const refreshAuth = async (): Promise<IUser | null> => {

        try {
            const response = await api.get("/user/profile")
            const raw = response?.data
            // Extract user object regardless of backend wrapper nesting
            let userData: any = raw?.data?.user || raw?.user || raw?.data || raw
            if (userData && typeof userData === 'object' && userData.user && typeof userData.user === 'object') {
                userData = userData.user
            }

            // Preserve role from localStorage if /user/profile didn't include it
            if (userData && typeof userData === 'object') {
                if (!userData.role) {
                    const cachedRole = localStorage.getItem('auth_user_role')
                    if (cachedRole) {
                        userData.role = cachedRole
                    }
                } else {
                    localStorage.setItem('auth_user_role', userData.role)
                }
            }

            console.log("AuthContext refreshAuth raw response:", raw)
            console.log("AuthContext resolved userData:", userData)

            setUser(userData as IUser)
            return userData as IUser
        } catch (error) {
            console.error("AuthContext refreshAuth error:", error)
            setUser(null)
            return null
        }

    }

    const refreshAccessToken = async (): Promise<boolean> => {
        try {
            await api.post("/auth/refresh-token")
            return true
        } catch (error) {
            console.error("[AuthContext] Token refresh failed:", error)
            return false
        }
    }

    // ------------------------------------------------------------------------
    // PROACTIVE AUTO-REFRESH TIMER: Refreshes access token every 10 minutes
    // Keeps user continuously logged in without session interruption
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (!user) return

        const TEN_MINUTES_MS = 10 * 60 * 1000

        // 1. Recurring timer: Refreshes token every 10 minutes
        const intervalId = setInterval(async () => {
            try {
                console.log("[Auth] Running proactive 10-minute token refresh...")
                await api.post("/auth/refresh-token")
                console.log("[Auth] Proactive token refresh successful.")
            } catch (err) {
                console.warn("[Auth] Proactive token refresh error:", err)
            }
        }, TEN_MINUTES_MS)

        // 2. Tab focus & visibility change: Refresh immediately if returning after sleep/background
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible") {
                try {
                    await api.post("/auth/refresh-token")
                } catch {
                    // Axios interceptor will handle if token expired
                }
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange)

        // 3. Listen for complete session expiry from Axios interceptor
        const handleSessionExpired = () => {
            setUser(null)
            if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
                window.location.href = "/login"
            }
        }
        window.addEventListener("auth-session-expired", handleSessionExpired)

        return () => {
            clearInterval(intervalId)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("auth-session-expired", handleSessionExpired)
        }
    }, [user])

    useEffect(() => {
        const checkAuthentication = async() => {
            await refreshAuth();
            setIsLoading(false);
        }

        checkAuthentication();
    },[])

    const logout = async() => {
        try{
            await api.post("/auth/logout")
        }
        finally{
            localStorage.removeItem('auth_user_role')
            localStorage.removeItem('admin_profile_avatar')
            localStorage.removeItem('student_profile_avatar')
            setUser(null)
        }
    };


    return (

        <AuthContext.Provider
        value={{
            user,
            isAuthenticated:!!user,
            isLoading,
            refreshAuth,
            refreshAccessToken,
            logout
        }}
        >
            {children}
        </AuthContext.Provider>
    )

}


export function  useAuth() {

    const context = useContext(AuthContext);

    if(!context){

        throw new Error("useAuth must be used inside AuthProvider");
    };

    return context;
} 

