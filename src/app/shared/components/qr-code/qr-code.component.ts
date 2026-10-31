import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-container d-inline-block text-center p-2 rounded bg-white border">
      <canvas #qrCanvas [width]="size" [height]="size"></canvas>
      @if (caption) {
        <div class="qr-caption mt-1 text-muted text-truncate" [style.max-width.px]="size">
          {{ caption }}
        </div>
      }
    </div>
  `,
  styles: [`
    .qr-container {
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .qr-caption {
      font-size: 0.72rem;
      font-family: monospace;
      direction: ltr;
    }
  `]
})
export class QrCodeComponent implements AfterViewInit, OnChanges {
  @Input() value = '';
  @Input() size = 120;
  @Input() caption?: string;

  @ViewChild('qrCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.renderQr();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['size']) {
      this.renderQr();
    }
  }

  private renderQr(): void {
    if (!this.canvasRef || !this.value) return;

    QRCode.toCanvas(
      this.canvasRef.nativeElement,
      this.value,
      {
        width: this.size,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      },
      error => {
        if (error) {
          console.warn('[QrCodeComponent] QR render error:', error);
        }
      }
    );
  }
}
