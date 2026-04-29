import { AbstractControl, ValidationErrors } from '@angular/forms';

export function trimValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value ?? '';
  return value.trim().length === 0 ? { nameEmpty: true } : null;
}
