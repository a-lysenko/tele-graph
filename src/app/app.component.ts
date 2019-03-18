import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'tele-graph';

  sayElemChange(val: {[key: string]: boolean}) {
    console.log('sayElemChange val', val);
  }
}
