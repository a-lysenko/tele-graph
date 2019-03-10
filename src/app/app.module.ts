import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DataGraphComponent } from './data-graph/data-graph.component';
import { LineGraphDirective } from './line-graph.directive';
import { OverviewGraphComponent } from './overview-graph/overview-graph.component';
import { RangeComponent } from './range/range.component';

@NgModule({
  declarations: [
    AppComponent,
    DataGraphComponent,
    LineGraphDirective,
    OverviewGraphComponent,
    RangeComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
