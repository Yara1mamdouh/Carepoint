import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appInputMask]',
  standalone: true
})
export class InputMaskDirective {
  @Input('appInputMask') maskType: 'phone' | 'nationalId' | 'digitsOnly' = 'digitsOnly';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, ''); // Extract only digits

    if (this.maskType === 'nationalId') {
      // 14 digits max
      if (value.length > 14) {
        value = value.substring(0, 14);
      }
      input.value = value;
    } else if (this.maskType === 'phone') {
      // Egyptian mobile format: 11 digits (e.g. 010 1234 5678)
      if (value.length > 11) {
        value = value.substring(0, 11);
      }
      input.value = value;
    } else {
      input.value = value;
    }
  }
}
