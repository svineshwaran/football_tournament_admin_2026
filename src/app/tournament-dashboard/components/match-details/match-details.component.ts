import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../../tournament/tournament.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { MatchTimelineComponent } from './components/match-timeline/match-timeline.component';
import { MatchEventEditorModalComponent } from './components/match-event-editor-modal/match-event-editor-modal.component';
import { MatchEditModalComponent } from './components/match-edit-modal/match-edit-modal.component';
import { MatchHeaderComponent } from './components/match-header/match-header.component';
import { MatchTabsComponent } from './components/match-tabs/match-tabs.component';
import { LineupComponent } from './components/lineup/lineup.component';
import { MatchInfoComponent } from './components/match-info/match-info.component';
import { H2hComponent } from './components/h2h/h2h.component';
import { LineupEditorComponent } from './components/lineup-editor/lineup-editor.component';

@Component({
    selector: 'app-match-details',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatchTimelineComponent,
        MatchEventEditorModalComponent,
        MatchEditModalComponent,
        MatchHeaderComponent,
        MatchTabsComponent,
        LineupComponent,
        MatchInfoComponent,
        H2hComponent,
        LineupEditorComponent
    ],
    templateUrl: './match-details.component.html'
})
export class MatchDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private tournamentService = inject(TournamentService);
    private http = inject(HttpClient);

    tournamentId = signal<string>('');
    matchId = signal<string>('');
    match = signal<any>(null);
    isLoading = signal<boolean>(true);

    isSaving = signal<boolean>(false);
    toastMessage = signal<string>('');

    // Edit fields for score (direct edit in UI if needed, but we'll use auto-calc in the background primarily now)
    homeScore = signal<number | null>(null);
    awayScore = signal<number | null>(null);

    // Dynamic state
    activeTab = signal<'timeline' | 'lineups' | 'stats' | 'info' | 'h2h'>('lineups');
    events = signal<any[]>([]);

    lineups = signal<any>(null);
    h2hData = signal<any>(null);

    // Modals
    isEditModalOpen = signal<boolean>(false);
    isEventModalOpen = signal<boolean>(false);
    isLineupModalOpen = signal<boolean>(false);
    selectedEventData = signal<any>(null);

    ngOnInit() {
        this.tournamentId.set(this.route.snapshot.paramMap.get('id') || '');
        this.matchId.set(this.route.snapshot.paramMap.get('matchId') || '');

        if (this.matchId()) {
            this.loadMatchDetails();
        }
    }

    loadMatchDetails() {
        this.isLoading.set(true);
        this.http.get<{ success: boolean, data: any }>(`${environment.apiBaseUrl}/api/matches/${this.matchId()}`).subscribe({
            next: (res) => {
                this.match.set(res.data);
                this.homeScore.set(res.data.homeScore !== undefined ? res.data.homeScore : null);
                this.awayScore.set(res.data.awayScore !== undefined ? res.data.awayScore : null);

                // Parse events from the match entity
                let matchEvents = [];
                if (res.data.events) {
                    try {
                        matchEvents = typeof res.data.events === 'string' ? JSON.parse(res.data.events) : res.data.events;
                    } catch (e) { console.error("Could not parse events", e); }
                }
                this.events.set(matchEvents);

                // Set default tab based on match status
                if (res.data.status === 'scheduled') {
                    this.activeTab.set('lineups');
                    this.fetchPreMatchData();
                } else {
                    this.activeTab.set('timeline');
                }

                this.isLoading.set(false);
            },
            error: (err) => {
                console.error("Failed to load match details", err);
                this.isLoading.set(false);
            }
        });
    }

    private fetchPreMatchData() {
        this.http.get<{ success: boolean, data: any }>(`${environment.apiBaseUrl}/api/matches/${this.matchId()}/lineups`).subscribe({
            next: (res) => {
                if (res.success) {
                    this.lineups.set(res.data);
                }
            },
            error: (err) => console.error("Error fetching lineups", err)
        });

        this.http.get<{ success: boolean, data: any }>(`${environment.apiBaseUrl}/api/matches/${this.matchId()}/h2h`).subscribe({
            next: (res) => {
                if (res.success) {
                    this.h2hData.set(res.data);
                }
            },
            error: (err) => console.error("Error fetching H2H", err)
        });
    }

    // Modal controls
    openEditModal() {
        this.isEditModalOpen.set(true);
    }

    closeEditModal() {
        this.isEditModalOpen.set(false);
    }

    openEventModal(eventData: any = null) {
        this.selectedEventData.set(eventData);
        this.isEventModalOpen.set(true);
    }

    closeEventModal() {
        this.isEventModalOpen.set(false);
        this.selectedEventData.set(null);
    }

    openLineupModal() {
        this.isLineupModalOpen.set(true);
    }

    closeLineupModal() {
        this.isLineupModalOpen.set(false);
    }

    // Handlers
    handleSaveMatchMetadata(data: any) {
        this.http.put<{ success: boolean, data: any }>(`${environment.apiBaseUrl}/api/matches/${this.matchId()}`, data).subscribe({
            next: (res) => {
                this.match.set(res.data);
                this.closeEditModal();
                this.showToast('Match details updated successfully!');
            },
            error: (err) => {
                console.error("Failed to update match", err);
                this.showToast('Failed to update match details.');
            }
        });
    }

    handleSaveLineups(lineupsData: { homeLineup: any, awayLineup: any }) {
        this.http.put<{ success: boolean, data: any }>(`${environment.apiBaseUrl}/api/matches/${this.matchId()}`, lineupsData).subscribe({
            next: (res) => {
                this.match.set(res.data);
                this.lineups.set({ homeLineup: lineupsData.homeLineup, awayLineup: lineupsData.awayLineup });
                this.closeLineupModal();
                this.showToast('Lineups updated successfully!');
            },
            error: (err) => {
                console.error("Failed to update lineups", err);
                this.showToast('Failed to update lineups.');
            }
        });
    }

    handleSaveEvent(data: any) {
        if (data.id) {
            // Edit existing event
            this.tournamentService.updateMatchEvent(this.matchId(), data.id, data).subscribe({
                next: () => {
                    this.loadMatchDetails(); // reload to get new scores & events
                    this.closeEventModal();
                    this.showToast('Event updated successfully!');
                },
                error: (err) => {
                    console.error("Failed to update event", err);
                    this.showToast('Failed to update event.');
                }
            });
        } else {
            // Add new event
            this.tournamentService.addMatchEvent(this.matchId(), data).subscribe({
                next: () => {
                    this.loadMatchDetails(); // reload to get new scores & events
                    this.closeEventModal();
                    this.showToast('Event added successfully!');
                },
                error: (err) => {
                    console.error("Failed to add event", err);
                    this.showToast('Failed to add event.');
                }
            });
        }
    }

    handleDeleteEvent(eventId: string) {
        this.tournamentService.deleteMatchEvent(this.matchId(), eventId).subscribe({
            next: () => {
                this.loadMatchDetails();
                this.showToast('Event deleted successfully!');
            },
            error: (err) => {
                console.error("Failed to delete event", err);
                this.showToast('Failed to delete event.');
            }
        });
    }

    saveMatchResult() {
        if (this.homeScore() === null || this.awayScore() === null) {
            this.showToast('Please enter scores for both teams.');
            return;
        }

        this.isSaving.set(true);
        this.http.post<{ success: boolean, data: any }>(`${environment.apiBaseUrl}/api/matches/${this.matchId()}/result`, {
            homeScore: this.homeScore(),
            awayScore: this.awayScore()
        }).subscribe({
            next: (res) => {
                this.match.set(res.data);
                this.isSaving.set(false);
                this.showToast('Match result saved successfully!');
            },
            error: (err) => {
                console.error("Failed to save match result", err);
                this.isSaving.set(false);
                this.showToast('Failed to save match result.');
            }
        });
    }

    goBack() {
        // Go back to tournament dashboard, matches tab
        this.router.navigate(['/tournaments', this.tournamentId()], { queryParams: { tab: 'matches' } });
    }

    showToast(message: string) {
        this.toastMessage.set(message);
        setTimeout(() => this.toastMessage.set(''), 3000);
    }
}
