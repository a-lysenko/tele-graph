import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {DataItem, GraphData} from '../app.types';
// @ts-ignore
import jDataSrc from '../../assets/1_4911446315889590343.json';
import {flatColumns, prepareGraphData} from '../_utils/data-transform.util';

@Component({
  selector: 'tg-overview-graph',
  templateUrl: './overview-graph.component.html',
  styleUrls: ['./overview-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewGraphComponent implements OnInit {

  // data: DataItem = jDataSrc[0];
  // flatData: GraphData;

  constructor() {
    // this.flatData = prepareGraphData(this.data);
  }

  ngOnInit() {
  }

}
