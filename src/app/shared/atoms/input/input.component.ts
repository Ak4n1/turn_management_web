import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() id?: string;
  @Input() name?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() hasError: boolean = false;
  @Input() ariaDescribedBy?: string;
  @Input() ariaInvalid?: string;
  @Input() ariaRequired?: string;
  @Input() maxLength?: number;
  @Input() autocomplete?: string;
  @Input() min?: number | string;
  @Input() max?: number | string;
  @Input() step?: number | string;

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
    const classes = ['input'];
    if (this.hasError) classes.push('input-error');
    if (this.disabled) classes.push('input-disabled');
    return classes.join(' ');
  }
}

