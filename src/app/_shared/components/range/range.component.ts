import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {fromEvent, merge} from 'rxjs';
import {distinctUntilChanged, map, switchMap, takeUntil, tap} from 'rxjs/operators';

interface ValuesChange {
  minValue: number;
  maxValue: number;
}

@Component({
  selector: 'tg-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss']
})
export class RangeComponent implements OnInit, AfterViewInit {

  private readonly minIntervalPx = 20;

  @Input() minVal = 25;
  @Input() maxVal = 75;

  @ViewChild('leftPointer') leftPointer: ElementRef<HTMLDivElement>;
  @ViewChild('rightPointer') rightPointer: ElementRef<HTMLDivElement>;
  @ViewChild('container') container: ElementRef<HTMLElement>;

  minPosition = 0;
  maxPosition = 0;

  @Output() valuesChange = new EventEmitter<ValuesChange>();

  constructor(private cRef: ChangeDetectorRef) {
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    const containerRect = this.container.nativeElement.getBoundingClientRect();
    const leftPointerRect = this.leftPointer.nativeElement.getBoundingClientRect();
    const rightPointerRect = this.rightPointer.nativeElement.getBoundingClientRect();

    const availableContainerWidth = containerRect.width - rightPointerRect.width;

    this.cRef.detach();
    this.calcPointerPositions(availableContainerWidth);
    this.cRef.detectChanges();
    this.cRef.reattach();

    merge(
      fromEvent(this.leftPointer.nativeElement, 'mousedown')
        .pipe(
          switchMap(() => {
            return fromEvent<MouseEvent>(document, 'mousemove')
              .pipe(
                takeUntil(fromEvent(document, 'mouseup'))
              );
          }),
          tap(({clientX}) => {
            this.minPosition = Math.min(
              Math.max(clientX - containerRect.left, 0),
              this.maxPosition - this.minIntervalPx
            );
          })
        ),
      fromEvent(this.rightPointer.nativeElement, 'mousedown')
        .pipe(
          switchMap(() => {
            return fromEvent<MouseEvent>(document, 'mousemove')
              .pipe(
                takeUntil(fromEvent(document, 'mouseup'))
              );
          }),
          tap(({clientX}) => {
            this.maxPosition = Math.max(
              Math.min(clientX - containerRect.left, availableContainerWidth),
              this.minPosition + this.minIntervalPx
            );
          })
        )
    )
      .pipe(
        map(() => {
          const calculatedMinValue = this.minPosition / availableContainerWidth * 100;
          const calculatedMaxValue = this.maxPosition / availableContainerWidth * 100;

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
        console.log('minValue', minValue, 'maxValue', maxValue);
        this.valuesChange.emit({minValue, maxValue});
      });
  }

  private calcPointerPositions(availableContainerWidth) {
    this.minPosition = this.minVal ? availableContainerWidth / 100 * this.minVal : 0;
    this.maxPosition = this.maxVal ? availableContainerWidth / 100 * this.maxVal : availableContainerWidth;
  }

}
