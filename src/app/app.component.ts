import {ChangeDetectionStrategy, Component} from '@angular/core';
// @ts-ignore
import jDataSrc from '../assets/1_4911446315889590343.json';
import {DataItem} from './app.types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Tele Graph';

  dataSrc: DataItem[] = jDataSrc;

  trackByFn(index) {
    return index;
  }
}
