import axios from "axios";

const API_BASE_URL = "https://cricketbet-pro.onrender.com/api";

class ApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common["Authorization"];
    }
  }

  // Generic methods
  get(url: string, config?: any) {
    return this.axiosInstance.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.axiosInstance.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.axiosInstance.delete(url, config);
  }

  // Specific API methods
  async getMatches(status?: string) {
    const params = status ? { status } : {};
    return this.get("/matches", { params });
  }

  async getMatch(id: string) {
    return this.get(`/matches/${id}`);
  }

  async getLiveMatches() {
    return this.get("/matches/status/live");
  }

  async getMyBets() {
    return this.get("/bets/my");
  }

  async placeBet(betData: any) {
    return this.post("/bets/place", betData);
  }

  async cashOutBet(betId: string) {
    return this.post(`/bets/cashout/${betId}`);
  }

  async getWallet() {
    return this.get("/wallet");
  }

  async deposit(amount: number, method?: string) {
    return this.post("/wallet/deposit", { amount, method });
  }

  async withdraw(amount: number, method?: string) {
    return this.post("/wallet/withdraw", { amount, method });
  }

  async getWalletHistory() {
    return this.get("/wallet/history");
  }

  // Admin methods
  async getAdminStats() {
    return this.get("/admin/stats");
  }

  async getAdminUsers() {
    return this.get("/admin/users");
  }

  async getAdminBets() {
    return this.get("/admin/bets");
  }

  async resolveMatch(matchId: string, result: any) {
    return this.post(`/admin/resolve-match/${matchId}`, result);
  }
}

export const api = new ApiService();
