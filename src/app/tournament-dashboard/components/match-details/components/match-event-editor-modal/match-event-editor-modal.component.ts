import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-match-event-editor-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './match-event-editor-modal.component.html'
})
export class MatchEventEditorModalComponent implements OnInit {
    @Input() isOpen = false;
    @Input() match: any;
    @Input() eventData: any = null; // If passed, it's edit mode

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    formData: any = {
        type: 'goal',
        minute: '',
        team: 'home', // 'home' or 'away'
        playerName: '',
        details: '' // e.g. "Penalty", "Header", or player out for sub
    };

    isSubmitting = false;

    ngOnInit() {
        if (this.eventData) {
            this.formData = { ...this.eventData };
        } else {
            this.formData.team = 'home';
        }
    }

    onClose() {
        this.close.emit();
    }

    onSubmit() {
        if (!this.formData.playerName || !this.formData.minute) {
            alert('Please fill in required fields: Player Name and Minute.');
            return;
        }
        this.isSubmitting = true;
        // The teamId is important so backend knows exactly which team.
        if (this.formData.team === 'home') {
            this.formData.teamId = this.match?.homeTeam?.id?.toString();
        } else {
            this.formData.teamId = this.match?.awayTeam?.id?.toString();
        }

        this.save.emit(this.formData);
        // We do not close or set isSubmitting false here, the parent handles it.
    }
}
