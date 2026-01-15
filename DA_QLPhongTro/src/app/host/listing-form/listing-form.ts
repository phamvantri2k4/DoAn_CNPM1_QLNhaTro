import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Listing } from '../../models/listing.model';
import { ListingService } from '../../services/listing.service';
import { HttpService } from '../../services/http-service';
import { Room } from '../../models/room.model';
import { RoomService } from '../../services/room.service';
import { Hostel } from '../../models/hostel.model';
import { HostelService } from '../../services/hostel.service';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../components/dialog/dialog.service';

@Component({
  selector: 'app-host-listing-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './listing-form.html',
  styleUrl: './listing-form.css'
})
export class HostListingFormComponent {
  form: Partial<Listing> = {
    title: '',
    description: '',
    status: 'VISIBLE'
  };
  isEdit = false;
  message = '';
  hostels: Hostel[] = [];
  selectedHostelId?: number;
  rooms: Room[] = [];
  isLoading = false;
  images: string[] = [];
  isReadingImages = false;
  roomsWithPosts: Set<number> = new Set(); // Danh sách roomId đã có bài đăng

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private http: HttpService,
    private roomService: RoomService,
    private hostelService: HostelService,
    private auth: AuthService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.loadRoomsWithPosts(); // Load danh sách phòng đã có bài đăng
    this.reloadHostels();

    // Nếu có roomId trong query params, tự động chọn phòng đó
    const preRoomId = this.route.snapshot.queryParamMap.get('roomId');
    if (preRoomId && !this.form.roomId) {
      this.form.roomId = Number(preRoomId);
    }

    const preHostelId = this.route.snapshot.queryParamMap.get('hostelId');
    if (preHostelId) {
      this.selectedHostelId = Number(preHostelId);
      this.onHostelChange();
    }

    // Nếu đang edit, load dữ liệu
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.listingService.getById(Number(id)).subscribe({
        next: (res) => {
          this.form = res;
          this.images = res?.images && res.images.length ? [...res.images] : [];
          this.form.imagesJson = this.images.length ? JSON.stringify(this.images) : undefined;
          
          // Nếu có roomId, load thông tin phòng để lấy hostelId
          if (this.form.roomId) {
            this.roomService.getById(this.form.roomId).subscribe({
              next: (room) => {
                if (room.hostelId) {
                  this.selectedHostelId = room.hostelId;
                  // Load danh sách phòng của trọ đó
                  this.onHostelChange();
                }
              },
              error: () => {
                console.error('Không tải được thông tin phòng');
              }
            });
          }
        },
        error: () => this.message = 'Không tải được bài đăng'
      });
    }
  }

  reloadHostels(): void {
    const ownerId = this.auth.getCurrentUserId();
    if (!ownerId) {
      this.hostels = [];
      this.rooms = [];
      this.selectedHostelId = undefined;
      this.form.roomId = undefined;
      return;
    }

    this.hostelService.getAll(ownerId).subscribe({
      next: (data) => {
        this.hostels = data || [];
        if (this.selectedHostelId) {
          this.onHostelChange();
        }
      },
      error: () => {
        this.hostels = [];
        this.rooms = [];
        this.selectedHostelId = undefined;
        this.form.roomId = undefined;
      }
    });
  }

  onHostelChange(): void {
    const ownerId = this.auth.getCurrentUserId();
    if (!ownerId || !this.selectedHostelId) {
      this.rooms = [];
      this.form.roomId = undefined;
      return;
    }
    this.roomService.getRooms(ownerId, this.selectedHostelId).subscribe({
      next: (data: Room[]) => {
        this.rooms = data || [];
        if (this.form.roomId && !this.rooms.some((r) => (r.id ?? r.roomId) === this.form.roomId)) {
          this.form.roomId = undefined;
        }
      },
      error: () => {
        this.rooms = [];
        this.form.roomId = undefined;
      }
    });
  }

  // Load danh sách phòng đã có bài đăng của owner
  loadRoomsWithPosts(): void {
    this.listingService.getMine().subscribe({
      next: (posts) => {
        this.roomsWithPosts = new Set(posts.map(p => p.roomId).filter(id => id != null));
      },
      error: () => {
        this.roomsWithPosts = new Set();
      }
    });
  }

  // Kiểm tra phòng đã có bài đăng chưa
  hasPost(roomId: number | undefined): boolean {
    if (!roomId) return false;
    return this.roomsWithPosts.has(roomId);
  }

  // Lấy text hiển thị cho option phòng
  getRoomOptionText(room: Room): string {
    const roomId = room.id ?? room.roomId;
    const hasPost = this.hasPost(roomId);
    return hasPost ? `${room.title} (đã có bài đăng)` : room.title;
  }

  submit(): void {
    if (!this.form.roomId) {
      this.message = 'Vui lòng chọn phòng để đăng bài';
      return;
    }

    if (this.isReadingImages) {
      this.message = 'Ảnh đang được tải lên, vui lòng đợi một chút rồi bấm Đăng bài lại';
      return;
    }

    this.isLoading = true;

    // Lưu nhiều ảnh dạng JSON array string (backend sẽ tự lấy ảnh đầu tiên cho trang chủ qua /posts/list)
    this.form.imagesJson = this.images.length ? JSON.stringify(this.images) : undefined;

    if (this.isEdit) {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) return;
      this.listingService.update(Number(id), this.form).subscribe({
        next: () => {
          this.message = 'Đã cập nhật bài đăng';
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/host/listings']), 1000);
        },
        error: () => {
          this.message = 'Cập nhật thất bại';
          this.isLoading = false;
        }
      });
    } else {
      this.listingService.create(this.form).subscribe({
        next: () => {
          this.message = 'Đã tạo bài đăng thành công!';
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/host/listings']), 1000);
        },
        error: (err) => {
          this.message = 'Tạo bài đăng thất bại';
          const detail = String(err?.error?.message || err?.message || '').trim();
          if (detail) this.message += `: ${detail}`;
          this.isLoading = false;
        }
      });
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    // Upload ảnh lên server -> nhận URL -> THÊM vào danh sách hiện tại
    // Không xóa ảnh cũ, cho phép upload nhiều lần
    this.isReadingImages = true;
    let pending = files.length;

    const finishOne = () => {
      pending -= 1;
      if (pending <= 0) {
        this.isReadingImages = false;
        this.form.imagesJson = this.images.length ? JSON.stringify(this.images) : undefined;
      }
    };

    files.forEach((file) => {
      this.http.uploadPostImage(file).subscribe({
        next: (res) => {
          if (res?.url) {
            this.images = [...this.images, res.url];
          }
          finishOne();
        },
        error: () => {
          finishOne();
        }
      });
    });

    // Reset input để có thể chọn lại cùng file
    input.value = '';
  }

  removeImage(index: number): void {
    this.images = this.images.filter((_, i) => i !== index);
    this.form.imagesJson = this.images.length ? JSON.stringify(this.images) : undefined;
  }

  clearAllImages(): void {
    this.dialog.confirm('Bạn có chắc muốn xóa tất cả ảnh?', {
      title: 'Xóa tất cả ảnh',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      onConfirm: () => {
        this.images = [];
        this.form.imagesJson = undefined;
      }
    });
  }

  moveImageUp(index: number): void {
    if (index <= 0) return;
    const temp = this.images[index];
    this.images[index] = this.images[index - 1];
    this.images[index - 1] = temp;
    this.form.imagesJson = JSON.stringify(this.images);
  }

  moveImageDown(index: number): void {
    if (index >= this.images.length - 1) return;
    const temp = this.images[index];
    this.images[index] = this.images[index + 1];
    this.images[index + 1] = temp;
    this.form.imagesJson = JSON.stringify(this.images);
  }

  getPreviewUrl(url: string): string {
    const s = String(url || '').trim();
    if (!s) return '';
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/')) return s;
    if (s.startsWith('/')) return `${this.http.getApiOrigin()}${s}`;
    return s;
  }
}
