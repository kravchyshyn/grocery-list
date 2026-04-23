import { Component, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroceryItem, GroceryItemPayload } from '../../models/grocery-item.model';

@Component({
  selector: 'app-item-form',
  imports: [ReactiveFormsModule],
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.scss'
})
export class ItemFormComponent implements OnInit {
  editItem = input<GroceryItem | null>(null);
  saved = output<GroceryItemPayload>();
  cancelled = output<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    const item = this.editItem();
    this.form = this.fb.group({
      name: [item?.name ?? '', [Validators.required, Validators.minLength(1)]],
      amount: [item?.amount ?? ''],
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const item = this.editItem();
    this.saved.emit({
      name: this.form.value.name.trim(),
      amount: this.form.value.amount?.trim() ?? '',
      bought: item?.bought ?? false,
    });
  }

  cancel() {
    this.cancelled.emit();
  }

  get nameInvalid() {
    const ctrl = this.form.get('name');
    return ctrl?.invalid && ctrl?.touched;
  }
}
