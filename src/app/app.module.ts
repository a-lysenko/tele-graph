import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DataGraphComponent } from './data-graph/data-graph.component';
import { OverviewGraphComponent } from './overview-graph/overview-graph.component';
import { RangeComponent } from './range/range.component';
import {SharedModule} from './_shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    DataGraphComponent,
    OverviewGraphComponent,
    RangeComponent
  ],
  imports: [
    BrowserModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
