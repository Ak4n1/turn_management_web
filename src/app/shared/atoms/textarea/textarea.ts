import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  templateUrl: './textarea.html',
  styleUrl: './textarea.css'
})
export class TextareaComponent implements ControlValueAccessor {
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
  @Input() rows: number = 4;
  @Input() resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'vertical';

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
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

  get textareaClasses(): string {
    const classes = ['textarea'];
    if (this.hasError) classes.push('textarea-error');
    if (this.disabled) classes.push('textarea-disabled');
    return classes.join(' ');
  }

  get textareaStyle(): { [key: string]: string } {
    return {
      resize: this.resize
    };
  }
}
