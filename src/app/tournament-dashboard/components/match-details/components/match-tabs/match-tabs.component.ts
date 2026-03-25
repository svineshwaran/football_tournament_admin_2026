import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-match-tabs',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './match-tabs.component.html'
})
export class MatchTabsComponent {
    @Input() activeTab: 'timeline' | 'lineups' | 'stats' | 'info' | 'h2h' = 'lineups';
    @Output() tabChange = new EventEmitter<'timeline' | 'lineups' | 'stats' | 'info' | 'h2h'>();

    onTabClick(tab: 'timeline' | 'lineups' | 'stats' | 'info' | 'h2h') {
        this.tabChange.emit(tab);
    }
}
