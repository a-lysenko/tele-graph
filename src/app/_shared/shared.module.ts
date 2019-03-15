import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LineGraphDirective} from './directives/line-graph/line-graph.directive';
import {RangeComponent} from './components/range/range.component';

@NgModule({
  declarations: [
    LineGraphDirective,
    RangeComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LineGraphDirective,
    RangeComponent
  ]
})
export class SharedModule { }
