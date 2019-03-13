import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LineGraphDirective} from './directives/line-graph/line-graph.directive';

@NgModule({
  declarations: [
    LineGraphDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LineGraphDirective
  ]
})
export class SharedModule { }
