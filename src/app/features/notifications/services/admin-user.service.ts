import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUserSearchItem } from '../models/admin-user-search-item.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/admin/users';

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  }

  searchUsers(params: { query: string; limit?: number }): Observable<AdminUserSearchItem[]> {
    let httpParams = new HttpParams().set('query', params.query);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<AdminUserSearchItem[]>(`${this.apiUrl}/search`, {
      ...this.getHttpOptions(),
      params: httpParams
    });
  }
}

