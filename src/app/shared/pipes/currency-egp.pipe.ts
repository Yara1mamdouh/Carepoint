import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyEgp',
  standalone: true
})
export class CurrencyEgpPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return showSymbol ? '0 ج.م' : '0';
    }

    const num = Number(value);
    const formatted = num.toLocaleString('ar-EG', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });

    return showSymbol ? `${formatted} ج.م` : formatted;
  }
}
