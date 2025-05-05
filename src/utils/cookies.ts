import Cookies from "js-cookie";

const COOKIE_PREFIX = "ts_auth_";
const COOKIE_EXPIRY = 30; // 30 days

interface AuthCookies {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenExpiration: number | null;
}

export const cookieUtils = {
  setAuthCookies: (data: Partial<AuthCookies>) => {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        Cookies.set(`${COOKIE_PREFIX}${key}`, String(value), {
          expires: COOKIE_EXPIRY,
          secure: true,
          sameSite: "strict",
          path: "/",
        });
      }
    });
  },

  getAuthCookies: (): AuthCookies => {
    return {
      accessToken: Cookies.get(`${COOKIE_PREFIX}accessToken`) || null,
      refreshToken: Cookies.get(`${COOKIE_PREFIX}refreshToken`) || null,
      expiresIn: Number(Cookies.get(`${COOKIE_PREFIX}expiresIn`)) || null,
      tokenExpiration:
        Number(Cookies.get(`${COOKIE_PREFIX}tokenExpiration`)) || null,
    };
  },

  clearAuthCookies: () => {
    ["accessToken", "refreshToken", "expiresIn", "tokenExpiration"].forEach(
      (key) => {
        Cookies.remove(`${COOKIE_PREFIX}${key}`, {
          path: "/",
          secure: true,
          sameSite: "strict",
        });
      },
    );
  },
};
