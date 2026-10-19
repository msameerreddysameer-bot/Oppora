import api from "./api";

export const login = async (data: { 
    email: string;
    password: string;
}) => {
    const response = await api.post("/auth/login", data);

    return {
        ...response.data,
        ...(response.data?.data && typeof response.data.data === 'object' ? response.data.data : {}),
        data: response.data?.data || response.data,
        status: response.status,
    };
};

export const signup = async (data: {
    FullName: string;
    email: string;
    password: string;
}) => {
    const response = await api.post("/auth/register", data);

    return {
        ...response.data,
        status: response.status,
    };
};

export const verifyEmail = async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);

    return {
        ...response.data,
        status: response.status,
    };
};

export const resendVerificationEmail = async (email: string) => {
    const response = await api.post("/auth/resend-verification-email", { email });

    return {
        ...response.data,
        status: response.status,
    };
};

export const forgotPassword = async (email: string) => {
    try {
        const response = await api.post("/auth/forgot-password", { email });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const resetPassword = async (token: string, password: string) => {
    try {
        const response = await api.post(`/auth/reset-password?token=${encodeURIComponent(token)}`, { password });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await api.post(`/auth/logout`);
        return response.data;
    } catch (error) {
        console.error((error as Error).message);
        throw error;
    }
};

export const apiRefreshAccessToken = async () => {
    try {
        const response = await api.post(`/auth/refresh-token`);
        return response.data;
    } catch (error) {
        console.error((error as Error).message);
        throw error;
    }
};
