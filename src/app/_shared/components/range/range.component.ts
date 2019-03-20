import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import {combineLatest, fromEvent, merge, of} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  throttleTime
} from 'rxjs/operators';
import {GraphService} from '../../../services/graph.service';
import {async} from 'rxjs/internal/scheduler/async';
import {RangeData} from '../../../app.types';
import {animationTimeMs} from '../../../app.constants';

@Component({
  selector: 'tg-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeComponent implements OnInit, AfterViewInit {

  private readonly minIntervalPx = 20;

  @Input() minValue = 25;
  @Input() maxValue = 50;
  @Input() throttlePause = animationTimeMs;

  @ViewChild('leftPointer') leftPointer: ElementRef<HTMLDivElement>;
  @ViewChild('rightPointer') rightPointer: ElementRef<HTMLDivElement>;
  @ViewChild('pointerContainer') pointerContainer: ElementRef<HTMLDivElement>;
  @ViewChild('container') container: ElementRef<HTMLElement>;

  minPosition = 0;
  maxPosition = 0;

  @Output() valuesChange = new EventEmitter<RangeData>();

  constructor(
    private cRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private graphService: GraphService
  ) {
  }

  ngOnInit() {
    this.graphService.getDataModel()
      .pipe(
        take(1)
      )
      .subscribe(({range}) => {
        this.minValue = range.minValue;
        this.maxValue = range.maxValue;
      });

    this.graphService.action$.next(
      this.valuesChange
        .pipe(
          throttleTime(this.throttlePause, async, {trailing: true}),
          startWith({
            minValue: this.minValue,
            maxValue: this.maxValue
          }),
          /*pairwise(),
          tap(([from, to]) => {
            console.log('from', from, 'to', to);
          }),
          map(([, to]) => {
            return {range: to};
          })*/
          map((to) => {
            return {range: to};
          })
        )
    );
  }

  ngAfterViewInit(): void {
    const containerRect = this.container.nativeElement.getBoundingClientRect();
    const leftPointerRect = this.leftPointer.nativeElement.getBoundingClientRect();
    const rightPointerRect = this.rightPointer.nativeElement.getBoundingClientRect();

    const availableContainerWidth = containerRect.width - rightPointerRect.width;

    this.cRef.detach();
    console.log('this.minValue', this.minValue, 'this.maxValue', this.maxValue);
    this.calcPointerPositions(availableContainerWidth);
    this.cRef.detectChanges();
    this.cRef.reattach();

    merge(
      fromEvent(this.leftPointer.nativeElement, 'mousedown')
        .pipe(
          switchMap((event) => {
            event.stopImmediatePropagation();
            return fromEvent<MouseEvent>(document, 'mousemove')
              .pipe(
                takeUntil(fromEvent(document, 'mouseup'))
              );
          }),
          tap(({clientX}) => {
            this.minPosition = Math.min(
              Math.max(clientX - containerRect.left, 0),
              (availableContainerWidth - this.maxPosition) - this.minIntervalPx
            );
          })
        ),
      fromEvent(this.rightPointer.nativeElement, 'mousedown')
        .pipe(
          switchMap((event) => {
            event.stopImmediatePropagation();
            return fromEvent<MouseEvent>(document, 'mousemove')
              .pipe(
                takeUntil(fromEvent(document, 'mouseup'))
              );
          }),
          tap(({clientX}) => {
            this.maxPosition = availableContainerWidth - Math.max(
              Math.min(clientX - containerRect.left, availableContainerWidth),
              this.minPosition + this.minIntervalPx
            );
          })
        ),
      fromEvent(this.pointerContainer.nativeElement, 'mousedown')
        .pipe(
          switchMap((mouseDownEvent: MouseEvent) => {
            console.log('### mouseDownEvent', mouseDownEvent);
            return combineLatest([
              fromEvent<MouseEvent>(document, 'mousemove'),
              of(mouseDownEvent.clientX)
            ])
              .pipe(
                takeUntil(fromEvent(document, 'mouseup'))
              );
          }),
          tap(([mouseMoveEvent, initialClientX]) => {
            const {clientX} = mouseMoveEvent;
            console.log('#### clientX', clientX, 'initialClientX', initialClientX);
            const deltaX = clientX - initialClientX;

            const potentialMinPos = this.minPosition + deltaX;
            const potentialMaxPos = this.maxPosition - deltaX;

            if (potentialMinPos < 0) {
              const shift = this.minPosition;
              this.minPosition = 0;
              this.maxPosition = this.maxPosition + shift;
            } else if (potentialMaxPos < 0) {
              const shift = this.maxPosition;
              this.minPosition = this.minPosition + shift;
              this.maxPosition = 0;
            } else {
              this.minPosition = potentialMinPos;
              this.maxPosition = potentialMaxPos;
            }
          })
        )
    )
      .pipe(
        map(() => {
          const calculatedMinValue = this.minPosition / availableContainerWidth * 100;
          const calculatedMaxValue =
            (availableContainerWidth - this.maxPosition) / availableContainerWidth * 100;

          return {
            minValue: +calculatedMinValue.toFixed(2),
            maxValue: +calculatedMaxValue.toFixed(2)
          };
        }),
        distinctUntilChanged((prev, curr) => {
          return prev.maxValue === curr.maxValue
            && prev.minValue === curr.minValue;
        })
      )
      .subscribe(({minValue, maxValue}) => {
        this.cRef.markForCheck();
        this.valuesChange.emit({minValue, maxValue});
      });
  }

  private calcPointerPositions(availableContainerWidth) {
    this.minPosition = this.minValue ? availableContainerWidth / 100 * this.minValue : 0;
    this.maxPosition = this.maxValue
      ? availableContainerWidth - availableContainerWidth / 100 * this.maxValue
      : 0;
  }

}
