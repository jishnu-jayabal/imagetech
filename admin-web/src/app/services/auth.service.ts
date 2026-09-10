import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminUser, AdminRole } from '../models/admin.models';
import { environment } from '../../environments/environment';

function fromFirestoreValue(v: any): any {
  if (!v) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  return null;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { integerValue: val.toString() };
  return { stringValue: String(val) };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiKey = environment.firebase.apiKey;
  private projectId = environment.firebase.projectId;
  private authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts';
  private firestoreUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;

  private currentUserSubject: BehaviorSubject<AdminUser | null>;
  public currentUser$: Observable<AdminUser | null>;

  constructor(private router: Router) {
    const savedUser = this.getSavedUser();
    this.currentUserSubject = new BehaviorSubject<AdminUser | null>(savedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  private getSavedUser(): AdminUser | null {
    try {
      const data = localStorage.getItem('image_mobiles_admin_auth');
      if (!data) return null;
      const user: AdminUser = JSON.parse(data);
      if (user.expiresAt && Date.now() > user.expiresAt) {
        localStorage.removeItem('image_mobiles_admin_auth');
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  public isLoggedIn(): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.idToken) return false;
    if (user.expiresAt && Date.now() > user.expiresAt) {
      this.signOut();
      return false;
    }
    return true;
  }

  public isSuperAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'super_admin';
  }

  public get currentUserValue(): AdminUser | null {
    return this.currentUserSubject.value;
  }

  async signIn(email: string, password: string): Promise<AdminUser> {
    const res = await fetch(`${this.authUrl}:signInWithPassword?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(this.mapAuthError(data.error.message));
    }

    const expiresInMs = (parseInt(data.expiresIn, 10) || 3600) * 1000;
    const isMasterAdmin = data.email.toLowerCase() === 'admin@imagemobiles.com';

    let role: AdminRole = isMasterAdmin ? 'super_admin' : 'branch_manager';
    let branchId = isMasterAdmin ? 'all' : '';
    let branchName = isMasterAdmin ? 'All Branches (Company-Wide)' : 'Assigned Branch';
    let displayName = data.displayName || (isMasterAdmin ? 'Super Administrator' : data.email.split('@')[0]);

    // Check if extra metadata exists in Firestore /admins
    try {
      const adminDocRes = await fetch(`${this.firestoreUrl}/admins/${data.localId}`);
      if (adminDocRes.ok) {
        const adminDoc = await adminDocRes.json();
        if (adminDoc.fields) {
          const fields: any = {};
          for (const [k, v] of Object.entries(adminDoc.fields)) {
            fields[k] = fromFirestoreValue(v);
          }
          if (fields.role) role = fields.role as AdminRole;
          if (fields.branchId) branchId = fields.branchId;
          if (fields.branchName) branchName = fields.branchName;
          if (fields.displayName) displayName = fields.displayName;
        }
      } else if (isMasterAdmin) {
        // Save Super Admin document in /admins for consistency
        await this.saveAdminDoc(data.localId, {
          uid: data.localId,
          email: data.email,
          displayName: 'Super Administrator',
          role: 'super_admin',
          branchId: 'all',
          branchName: 'All Branches'
        });
      }
    } catch (e) {
      console.warn('Admin profile sync notice:', e);
    }

    const user: AdminUser = {
      uid: data.localId,
      email: data.email,
      displayName,
      role,
      branchId,
      branchName,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + expiresInMs
    };

    localStorage.setItem('image_mobiles_admin_auth', JSON.stringify(user));
    this.currentUserSubject.next(user);
    return user;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const current = this.currentUserSubject.value;
    if (!current || !current.idToken) throw new Error('Not authenticated');

    const res = await fetch(`${this.authUrl}:update?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: current.idToken,
        password: newPassword,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(this.mapAuthError(data.error.message));
    }

    const updatedUser: AdminUser = {
      ...current,
      idToken: data.idToken || current.idToken,
      refreshToken: data.refreshToken || current.refreshToken
    };
    localStorage.setItem('image_mobiles_admin_auth', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  async updateProfile(displayName: string): Promise<void> {
    const current = this.currentUserSubject.value;
    if (!current || !current.idToken) throw new Error('Not authenticated');

    const res = await fetch(`${this.authUrl}:update?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: current.idToken,
        displayName,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(this.mapAuthError(data.error.message));
    }

    // Also update in Firestore /admins
    try {
      await this.saveAdminDoc(current.uid, {
        displayName,
        email: current.email,
        role: current.role,
        branchId: current.branchId,
        branchName: current.branchName
      });
    } catch (_) {}

    const updatedUser: AdminUser = {
      ...current,
      displayName,
      idToken: data.idToken || current.idToken,
      refreshToken: data.refreshToken || current.refreshToken
    };
    localStorage.setItem('image_mobiles_admin_auth', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  /**
   * PDF Section 3.1: Super Admin creates a Branch Manager and assigns them to a specific branch.
   */
  async createBranchManager(
    email: string,
    password: string,
    displayName: string,
    branchId: string,
    branchName: string
  ): Promise<void> {
    const res = await fetch(`${this.authUrl}:signUp?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(this.mapAuthError(data.error.message));
    }

    const uid = data.localId;

    // Set displayName in Firebase Auth
    if (displayName) {
      try {
        await fetch(`${this.authUrl}:update?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: data.idToken,
            displayName,
            returnSecureToken: true
          })
        });
      } catch (_) {}
    }

    // Save in Firestore /admins
    await this.saveAdminDoc(uid, {
      uid,
      email: email.trim(),
      displayName,
      role: 'branch_manager',
      branchId,
      branchName,
      createdAt: new Date().toLocaleDateString('en-GB')
    });

    // Update branch document with assigned manager (PDF 3.1: Assign one Branch Manager per branch)
    if (branchId) {
      try {
        const updateUrl = `${this.firestoreUrl}/branches/${branchId}?updateMask.fieldPaths=managerName&updateMask.fieldPaths=managerEmail&updateMask.fieldPaths=managerUid`;
        await fetch(updateUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              managerName: { stringValue: displayName },
              managerEmail: { stringValue: email.trim() },
              managerUid: { stringValue: uid }
            }
          })
        });
      } catch (err) {
        console.warn('Failed to link manager to branch doc:', err);
      }
    }
  }

  async getBranchManagers(): Promise<any[]> {
    try {
      const res = await fetch(`${this.firestoreUrl}/admins`);
      const data = await res.json();
      if (!data.documents) return [];
      return data.documents.map((doc: any) => {
        const fields: any = { id: doc.name.split('/').pop() };
        for (const [k, v] of Object.entries(doc.fields || {})) {
          fields[k] = fromFirestoreValue(v);
        }
        return fields;
      }).filter((a: any) => a.role === 'branch_manager');
    } catch {
      return [];
    }
  }

  private async saveAdminDoc(uid: string, data: any): Promise<void> {
    const fields: any = {};
    for (const [k, v] of Object.entries(data)) {
      fields[k] = toFirestoreValue(v);
    }
    await fetch(`${this.firestoreUrl}/admins/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  }

  signOut(): void {
    localStorage.removeItem('image_mobiles_admin_auth');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private mapAuthError(msg: string): string {
    if (msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.includes('EMAIL_NOT_FOUND') || msg.includes('INVALID_PASSWORD')) {
      return 'Invalid email address or password. Please verify your credentials.';
    }
    if (msg.includes('USER_DISABLED')) {
      return 'This account has been disabled. Contact system administrator.';
    }
    if (msg.includes('EMAIL_EXISTS')) {
      return 'An account with this email address already exists.';
    }
    if (msg.includes('WEAK_PASSWORD')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (msg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
      return 'Access temporarily locked due to multiple failed login attempts. Try again later.';
    }
    return msg || 'Authentication failed. Please check your credentials and try again.';
  }
}
