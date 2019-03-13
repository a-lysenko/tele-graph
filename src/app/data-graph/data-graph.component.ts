import {Component, OnInit} from '@angular/core';
// @ts-ignore
import jDataSrc from '../../assets/1_4911446315889590343.json';
import {DataItem, GraphData} from '../app.types';
import {flatColumns} from '../_utils/data-transform.util';

@Component({
  selector: 'tg-data-graph',
  templateUrl: './data-graph.component.html',
  styleUrls: ['./data-graph.component.scss']
})
export class DataGraphComponent implements OnInit {

  data: DataItem = jDataSrc[0];
  flatData: GraphData;

  constructor() {
    console.log('this.data', this.data);
    this.flatData = flatColumns(this.data.columns, this.data.types);
  }

  ngOnInit() {
  }

}
