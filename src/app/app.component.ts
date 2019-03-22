import {ChangeDetectionStrategy, Component} from '@angular/core';
// @ts-ignore
import jDataSrc from '../assets/1_4911446315889590343.json';
import {DataItem} from './app.types';
import {nightModeClass} from './app.constants';

enum ColorMode {
  Night = 'night mode',
  Day = 'day mode',
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Tele Graph';

  dataSrc: DataItem[] = jDataSrc;

  colorModes = ColorMode;

  private mode = ColorMode.Day;

  constructor() {
  }

  toggleMode() {
    this.mode = (this.mode === ColorMode.Day) ? ColorMode.Night : ColorMode.Day;

    document.body.classList.toggle(nightModeClass, this.mode === ColorMode.Night);
  }

  trackByFn(index) {
    return index;
  }
}
