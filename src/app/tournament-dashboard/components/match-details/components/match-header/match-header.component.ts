import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-match-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './match-header.component.html'
})
export class MatchHeaderComponent implements OnInit, OnDestroy {
    @Input() match: any;
    @Input() isLoading = false;

    @Output() editMatch = new EventEmitter<void>();
    @Output() addLineup = new EventEmitter<void>();
    @Output() startMatch = new EventEmitter<void>();

    countdown: string = '';
    private timer: any;

    ngOnInit() {
        if (this.match?.status === 'scheduled' && this.match?.startTime) {
            this.updateCountdown();
            this.timer = setInterval(() => this.updateCountdown(), 60000); // update every minute
        }
    }

    ngOnDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    private updateCountdown() {
        if (!this.match?.startTime) return;

        const now = new Date().getTime();
        const matchTime = new Date(this.match.startTime).getTime();
        const diff = matchTime - now;

        if (diff <= 0) {
            this.countdown = 'Started';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            this.countdown = `${days}d ${hours}h`;
        } else {
            this.countdown = `${hours}h ${minutes}m`;
        }
    }
}
