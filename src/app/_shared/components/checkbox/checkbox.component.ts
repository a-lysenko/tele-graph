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
  @Input() label = '';
  @Input() ref = 'unnamed';

  @Output() changeValue = new EventEmitter<{ [key: string]: boolean }>();

  constructor() {
  }

  ngOnInit() {
  }

  onChange(elem: HTMLInputElement) {
    this.changeValue.emit({[this.ref || this.label]: elem.checked});
  }

}
