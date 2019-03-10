import {Component, OnInit} from '@angular/core';
// @ts-ignore
import jDataSrc from '../../assets/1_4911446315889590343.json';
import {DataItem} from './data-graph.types';

@Component({
  selector: 'tg-data-graph',
  templateUrl: './data-graph.component.html',
  styleUrls: ['./data-graph.component.scss']
})
export class DataGraphComponent implements OnInit {

  data: DataItem = jDataSrc[0];

  constructor() {
    console.log('this.data', this.data);
  }

  ngOnInit() {
  }

}
