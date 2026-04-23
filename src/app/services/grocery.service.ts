import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GroceryItem, GroceryItemPayload } from '../models/grocery-item.model';

@Injectable({ providedIn: 'root' })
export class GroceryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/items';

  getItems(): Observable<GroceryItem[]> {
    return this.http.get<GroceryItem[]>(this.apiUrl);
  }

  addItem(payload: GroceryItemPayload): Observable<GroceryItem> {
    return this.http.post<GroceryItem>(this.apiUrl, payload);
  }

  updateItem(id: string | number, changes: Partial<GroceryItemPayload>): Observable<GroceryItem> {
    return this.http.patch<GroceryItem>(`${this.apiUrl}/${id}`, changes);
  }

  deleteItem(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
