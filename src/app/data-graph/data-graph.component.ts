import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {DataItem, DataRef, GraphData} from '../app.types';
import {prepareGraphData} from '../_utils/data-transform.util';
import {GraphService} from '../services/graph.service';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'tg-data-graph',
  templateUrl: './data-graph.component.html',
  styleUrls: ['./data-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [GraphService]
})
export class DataGraphComponent implements OnInit {

  @Input() graphTitle = '';
  @Input() data: DataItem = null;
  graphData: GraphData;
  linesActivity: { [key in DataRef]: boolean } = {};
  lineRefs: DataRef[] = [];

  constructor(
    private datePipe: DatePipe,
    private graphService: GraphService
  ) {
  }

  ngOnInit() {
    this.graphData = prepareGraphData(this.data);
    this.graphData = {
      ...this.graphData,
      x: this.graphData.x
        .map((valueMs) => this.datePipe.transform(new Date(valueMs), 'MMM d'))
    };
    this.lineRefs = Object.keys(this.data.names);
    this.linesActivity = this.lineRefs
      .reduce((acc, lineRef) => {
        return {
          ...acc,
          [lineRef]: true
        };
      }, {});

    this.graphService.action$.next({
      activeLines: this.getActiveLines(
        this.lineRefs, this.linesActivity
      )
    });
  }

  handleActivityChange(updateActivity: { [key in DataRef]: boolean }) {
    this.linesActivity = {
      ...this.linesActivity,
      ...updateActivity
    };

    this.graphService.action$.next({
      activeLines: this.getActiveLines(
        this.lineRefs, this.linesActivity
      )
    });
  }

  trackByFn(index) {
    return index;
  }

  private getActiveLines(
    lineRefs: DataRef[],
    linesActivity: { [key in DataRef]: boolean }
  ) {
    return lineRefs
      .filter((lineRef) => linesActivity[lineRef]);
  }

}
