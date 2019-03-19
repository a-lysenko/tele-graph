import {Injectable} from '@angular/core';
import {AppComponent} from '../app.component';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {DataItem, GraphData, RangeData} from '../app.types';
// @ts-ignore
import jDataSrc from '../../assets/1_4911446315889590343.json';
import {flatColumns} from '../_utils/data-transform.util';
import {mergeMap, scan, shareReplay} from 'rxjs/operators';

interface GraphServiceModel {
  range: RangeData;
  data: GraphData;
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  protected action$ = new BehaviorSubject<Partial<GraphServiceModel>>(null);
  protected dataModel$: Observable<GraphServiceModel>;

  constructor(
    /*reducer: (state: GraphServiceModel, action: Partial<GraphServiceModel>) => GraphServiceModel*/
    /*, initialState: GraphServiceModel*/
  ) {
    const data: DataItem = jDataSrc[0];
    const flatData = flatColumns(data.columns, data.types);

    const initState: GraphServiceModel = {
      range: {
        minValue: 5,
        maxValue: 95,
      },
      data: flatData
    };

    const reducer = (state: GraphServiceModel, change: Partial<GraphServiceModel>): GraphServiceModel => {
      return {
        ...state,
        ...change
      };
    };

    this.dataModel$ = this.action$.asObservable().pipe(
      mergeMap(action => (action instanceof Observable) ? action : of(action)),
      scan(reducer, initState),
      shareReplay(1)
    ) as any;
  }

  getDataModel() {
    return this.dataModel$;
  }

}
