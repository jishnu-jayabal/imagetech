import { Routes } from '@angular/router';
import { TrackComponent } from './track/track.component';

export const routes: Routes = [
  { path: 'track/:token', component: TrackComponent },
  { path: '', redirectTo: 'track/IMG-7204-KL', pathMatch: 'full' },
  { path: '**', redirectTo: 'track/IMG-7204-KL' }
];
