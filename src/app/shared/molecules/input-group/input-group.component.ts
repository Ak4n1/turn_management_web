import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LabelComponent } from '../../atoms/label/label.component';
import { InputComponent } from '../../atoms/input/input.component';
import { ErrorTextComponent } from '../../atoms/error-text/error-text.component';

@Component({
  selector: 'app-input-group',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelComponent, InputComponent, ErrorTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputGroupComponent),
      multi: true
    }
  ],
  templateUrl: './input-group.component.html',
  styleUrl: './input-group.component.css'
})
export class InputGroupComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() labelIcon?: string; // Font Awesome icon class
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() id?: string;
  @Input() name?: string;
  @Input() required: boolean = false;
  @Input() errorMessage?: string;
  @Input() maxLength?: number;
  @Input() autocomplete?: string;
  @Input() disabled: boolean = false;

  value: string = '';
  hasError: boolean = false;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(value: string): void {
    this.value = value;
    this.onChange(this.value);
    this.updateErrorState();
  }

  onBlur(): void {
    this.onTouched();
    this.updateErrorState();
  }

  updateErrorState(): void {
    this.hasError = !!this.errorMessage;
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

  get inputId(): string {
    return this.id || `input-${this.name || 'field'}`;
  }

  get errorId(): string {
    return `${this.inputId}-error`;
  }
}

