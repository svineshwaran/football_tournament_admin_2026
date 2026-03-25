import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PublicMatchData {
    match: {
        id: number;
        tournamentName: string;
        homeTeamName: string;
        homeTeamLogo?: string;
        awayTeamName: string;
        awayTeamLogo?: string;
        homeScore: number;
        awayScore: number;
        status: string;
        minute?: number;
        period: string;
    };
    presentation: {
        brandColor: string;
    };
    events: any[];
}

@Component({
    selector: 'app-match-scoreboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './match-scoreboard.component.html'
})
export class MatchScoreboardComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private http = inject(HttpClient);
    
    data = signal<PublicMatchData | null>(null);
    isLoading = signal(true);
    error = signal('');
    tournamentId = signal<string | null>(null);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            const tid = params.get('tournamentId');
            
            if (tid) this.tournamentId.set(tid);

            if (id) {
                this.loadMatchData(id);
                // Setup auto-refresh for live screen
                setInterval(() => {
                    this.silentReload(id);
                }, 10000); // 10s auto-refresh
            }
        });
    }

    loadMatchData(id: string) {
        this.isLoading.set(true);
        this.http.get<{success: boolean, data: PublicMatchData, message?: string}>(`${environment.apiBaseUrl}/api/public/match/${id}`).subscribe({
            next: (res) => {
                if (res.success) {
                    this.data.set(res.data);
                } else {
                    this.error.set(res.message || 'Failed to load match data');
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error("Match load error", err);
                this.error.set('Failed to connect to the server');
                this.isLoading.set(false);
            }
        });
    }

    silentReload(id: string) {
        this.http.get<{success: boolean, data: PublicMatchData}>(`${environment.apiBaseUrl}/api/public/match/${id}`).subscribe({
            next: (res) => {
                if (res.success) {
                    this.data.set(res.data);
                }
            }
        });
    }
}
