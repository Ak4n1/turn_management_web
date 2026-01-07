import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../../features/auth/models/register-request.model';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { AuthResponse } from '../../features/auth/models/auth-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
      // withCredentials ahora se maneja automáticamente por el interceptor
    };
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      request,
      this.getHttpOptions()
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      request,
      this.getHttpOptions()
    );
  }

  refreshToken(): Observable<AuthResponse> {
    // El refresh token viene en la cookie automáticamente
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh`,
      {},
      this.getHttpOptions()
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/logout`,
      {},
      this.getHttpOptions()
    );
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/resend-verification?email=${encodeURIComponent(email)}`,
      {},
      this.getHttpOptions()
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/verify-email?token=${encodeURIComponent(token)}`,
      this.getHttpOptions()
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/forgot-password`,
      { email },
      this.getHttpOptions()
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/reset-password/${token}`,
      { newPassword },
      this.getHttpOptions()
    );
  }
}

