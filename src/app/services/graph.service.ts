import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {DataRef, RangeData} from '../app.types';
import {mergeMap, scan, shareReplay} from 'rxjs/operators';

export interface GraphServiceModel {
  range: RangeData;
  activeLines: DataRef[];
}

type PartialGraphServiceModel = Partial<GraphServiceModel>;

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  /*protected*/
  action$ = new BehaviorSubject<PartialGraphServiceModel | Observable<PartialGraphServiceModel>>(null);
  protected dataModel$: Observable<GraphServiceModel>;

  constructor(
    /*reducer: (state: GraphServiceModel, action: PartialGraphServiceModel) => GraphServiceModel*/
    /*, initialState: GraphServiceModel*/
  ) {
    const initState: GraphServiceModel = {
      range: {
        minValue: 10,
        maxValue: 90,
      },
      activeLines: []
    };

    const reducer = (state: GraphServiceModel, change: PartialGraphServiceModel): GraphServiceModel => {
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
