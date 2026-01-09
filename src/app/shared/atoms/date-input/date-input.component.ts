import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

/**
 * Date Input Component - Atom
 * 
 * Input específico para fechas (type="date").
 * Implementa ControlValueAccessor para trabajar con ngModel y reactive forms.
 * 
 * @example
 * <app-date-input
 *   id="dateFrom"
 *   name="dateFrom"
 *   [ngModel]="dateFrom"
 *   (ngModelChange)="dateFrom = $event"
 *   [min]="minDate"
 *   [max]="maxDate"
 *   [required]="true">
 * </app-date-input>
 */
@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true
    }
  ],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.css'
})
export class DateInputComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() name?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() hasError: boolean = false;
  @Input() ariaDescribedBy?: string;
  @Input() ariaInvalid?: string;
  @Input() ariaRequired?: string;
  @Input() min?: string; // YYYY-MM-DD
  @Input() max?: string; // YYYY-MM-DD

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get inputClasses(): string {
    const classes = ['date-input'];
    if (this.hasError) classes.push('date-input-error');
    if (this.disabled) classes.push('date-input-disabled');
    return classes.join(' ');
  }
}

