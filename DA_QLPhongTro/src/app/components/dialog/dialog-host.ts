import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogState } from './dialog.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-host.html',
  styleUrl: './dialog-host.css'
})
export class DialogHostComponent {
  state$: Observable<DialogState | null>;

  constructor(private dialog: DialogService) {
    this.state$ = this.dialog.state$;
  }

  close(): void {
    this.dialog.close();
  }

  confirm(): void {
    const s = this.dialog.snapshot;
    if (s?.onConfirm) s.onConfirm();
    this.dialog.close();
  }

  cancel(): void {
    const s = this.dialog.snapshot;
    if (s?.onCancel) s.onCancel();
    this.dialog.close();
  }
}
