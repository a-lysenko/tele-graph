import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'tg-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent implements OnInit {

  @Input() checked: false;
  @Input() color: 'grey';
  @Input() label: string;
  @Input() name: string;

  @Output() changeValue = new EventEmitter<{ [key: string]: boolean }>();

  constructor() {
  }

  ngOnInit() {
  }

  onChange(elem: HTMLInputElement) {
    this.changeValue.emit({[this.name || this.label || 'unnamed']: elem.checked});
  }

}
