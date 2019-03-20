import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
// @ts-ignore
import jDataSrc from '../../assets/1_4911446315889590343.json';
import {DataItem, GraphData} from '../app.types';
import {flatColumns, prepareGraphData} from '../_utils/data-transform.util';

@Component({
  selector: 'tg-data-graph',
  templateUrl: './data-graph.component.html',
  styleUrls: ['./data-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataGraphComponent implements OnInit {

  data: DataItem = jDataSrc[0];
  flatData: GraphData;

  constructor() {
    this.flatData = prepareGraphData(this.data);
  }

  ngOnInit() {
  }

}
