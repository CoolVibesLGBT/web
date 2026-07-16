'use client'

import axios from "axios";
import type { AxiosInstance } from "axios";
import { serviceURL } from "@/appSettings";

class HttpClient {
  private instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL: `${baseURL}/api/`,
      timeout: 10000000,
    });

    // Request interceptor (örneğin token ekleme)
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      const headers = (config.headers ?? {}) as Record<string, string>;
      if (token) headers["Authorization"] = `${token}`;

      const isFormData =
        typeof FormData !== "undefined" && config.data instanceof FormData;
      if (!isFormData && !headers["Content-Type"] && config.data !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      config.headers = headers;
      return config;
    });

    // Response interceptor (örneğin 401 yakalama)
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn("Unauthorized — redirecting to login.");
          //localStorage.removeItem("authToken");
          // window.location.href = "/login"; // istersen aktif et
        }
        return Promise.reject(error);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

export const httpClient = new HttpClient(serviceURL[0]).getInstance();
