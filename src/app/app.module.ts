import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DataGraphComponent } from './data-graph/data-graph.component';
import {SharedModule} from './_shared/shared.module';
import {DatePipe} from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    DataGraphComponent,
  ],
  imports: [
    BrowserModule,
    SharedModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
