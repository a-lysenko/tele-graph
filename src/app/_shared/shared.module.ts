import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LineGraphDirective} from './directives/line-graph/line-graph.directive';
import {RangeComponent} from './components/range/range.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';

@NgModule({
  declarations: [
    LineGraphDirective,
    RangeComponent,
    CheckboxComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LineGraphDirective,
    RangeComponent,
    CheckboxComponent
  ]
})
export class SharedModule { }
