import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type DialogKind = 'success' | 'error' | 'info' | 'confirm' | 'loading';

export interface DialogState {
  open: boolean;
  title: string;
  message: string;
  kind: DialogKind;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private stateSubject = new BehaviorSubject<DialogState | null>(null);

  get state$(): Observable<DialogState | null> {
    return this.stateSubject.asObservable();
  }

  get snapshot(): DialogState | null {
    return this.stateSubject.value;
  }

  close(): void {
    const s = this.stateSubject.value;
    if (!s) return;
    const onClose = s.onClose;
    this.stateSubject.next({ ...s, open: false, onConfirm: undefined, onCancel: undefined, onClose: undefined });
    if (onClose) {
      try {
        onClose();
      } catch {
        // ignore
      }
    }
  }

  info(message: string, title = 'Thông báo', onClose?: () => void): void {
    this.open({ open: true, title, message, kind: 'info', onClose });
  }

  loading(message: string, title = 'Đang xử lý'): void {
    this.open({ open: true, title, message, kind: 'loading' });
  }

  success(message: string, title = 'Thành công', onClose?: () => void): void {
    this.open({ open: true, title, message, kind: 'success', onClose });
  }

  error(message: string, title = 'Lỗi', onClose?: () => void): void {
    this.open({ open: true, title, message, kind: 'error', onClose });
  }

  confirm(message: string, opts?: { title?: string; confirmText?: string; cancelText?: string; onConfirm?: () => void; onCancel?: () => void }): void {
    this.open({
      open: true,
      title: opts?.title || 'Xác nhận',
      message,
      kind: 'confirm',
      confirmText: opts?.confirmText || 'Đồng ý',
      cancelText: opts?.cancelText || 'Hủy',
      onConfirm: opts?.onConfirm,
      onCancel: opts?.onCancel
    });
  }

  private open(state: DialogState): void {
    this.stateSubject.next(state);
  }
}
