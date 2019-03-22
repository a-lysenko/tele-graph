import {AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {DataRef, GraphData, LinesData, RangeData} from '../../../app.types';
import {combine} from '../../../_utils/data-transform.util';
import {GraphService, GraphServiceModel} from '../../../services/graph.service';
import {filter, max, scan, skip, take, tap} from 'rxjs/operators';
import {animationTimeMs} from '../../../app.constants';

interface ViewPort {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LineGraphModel extends GraphServiceModel {
  activeLinesChanged?: boolean;
}

class SpareLines {

  readonly activeClass = 'horiz-line-group__active';
  private sets: SVGGElement[] = [];
  private activeSet: SVGGElement;
  private activeSetInd = -1;

  constructor(
    private hostElem: SVGElement,
    private set: { setsAmount: number, setBy: number },
    private renderer: Renderer2,
  ) {
    for (let setInd = 0; setInd < this.set.setsAmount; setInd++) {
      this.sets.push(
        this.createSet(this.hostElem, this.set.setBy)
      );
    }
  }

  public hide() {
    if (this.activeSet) {
      this.activeSet.classList.remove(this.activeClass);
    }
  }

  public toggle(viewHeight: number, viewShift: number, width: number) {
    if (this.activeSet) {
      this.activeSet.classList.remove(this.activeClass);
    }

    this.activeSetInd = (this.activeSetInd + 1) % this.sets.length;
    this.activeSet = this.sets[this.activeSetInd];

    const linesYs = this.getLinesY(viewHeight, viewShift, this.set.setBy);
    const lines = this.activeSet.children;
    linesYs.forEach((yVal, index) => {
      lines[index].setAttribute('d', `M 0 ${yVal} H ${width}`);
    });

    if (linesYs.length) {
      this.activeSet.classList.add(this.activeClass);
    }
  }

  public createSet(hostElem: SVGElement, setBy: number) {
    const gSet: SVGGElement = this.renderer.createElement('g', 'svg');
    this.renderer.addClass(gSet, 'horiz-line-group');

    for (let i = 0; i < setBy; i++) {
      const path: SVGPathElement = this.renderer.createElement('path', 'svg');
      this.renderer.setAttribute(path, 'd', '');
      // this.renderer.setAttribute(path, 'stroke', color);
      this.renderer.setAttribute(path, 'stroke-width', '0.7');
      this.renderer.setAttribute(path, 'vector-effect', 'non-scaling-stroke');
      this.renderer.setAttribute(path, 'fill', 'none');

      this.renderer.appendChild(gSet, path);
      this.renderer.appendChild(hostElem, gSet);
    }

    return gSet;
  }

  private getLinesY(viewValue: number, viewShift: number, setBy: number): number[] {
    const limitDiffRatio = 1.2;
    const getDigitNumber = (val: number) => {
      let valInt = parseInt('' + val, 10);
      let result = 1;
      while (valInt > 10) {
        result = result * 10;
        valInt = valInt / 10;
      }

      return result;
    };

    const tmpDigitNumber = getDigitNumber(viewValue);
    const maxY = calculate(viewValue, viewValue / limitDiffRatio, tmpDigitNumber);
    const yStep = maxY / 5;

    return (new Array(5))
      .fill(null)
      .map((_, ind) => {
        return yStep * (ind + 1);
      })
      .map((yVal) => {
        return viewShift + viewValue - yVal;
      });

    function calculate(topLimit: number, bottomLimit: number, digitNumber: number, acc = 0) {

      while ((acc + digitNumber) < topLimit) {
        acc += digitNumber;
      }

      return (acc < bottomLimit)
        ? calculate(topLimit, bottomLimit, digitNumber / 10, acc)
        : acc;
    }
  }

}

@Directive({
  selector: '[tgLineGraph]'
})
export class LineGraphDirective implements OnInit, AfterViewInit {

  @Input('tgLineGraph') data: GraphData;
  @Input() useRange = true;

  private initRange: RangeData = {
    minValue: 0, maxValue: 100
  };
  private initViewPort: ViewPort = null;
  private spareLines: SpareLines;

  constructor(
    private elem: ElementRef<SVGElement>,
    private renderer: Renderer2,
    private graphService: GraphService
  ) {
  }

  ngOnInit(): void {
    this.graphService.getDataModel()
      .pipe(
        take(1),
        filter(() => this.useRange)
      )
      .subscribe(({range}) => {
        this.initRange = {...range};
      });
  }

  ngAfterViewInit(): void {
    const svgElem = this.elem.nativeElement;
    if (this.useRange) {
      this.spareLines = new SpareLines(
        svgElem,
        {setsAmount: 2, setBy: 5},
        this.renderer);
    }

    const containerRect = svgElem.parentElement.getBoundingClientRect();

    const containerHeight = containerRect.height;
    const containerWidth = containerRect.width;

    this.setupElement(svgElem, containerWidth, containerHeight);

    const stepX = containerWidth / (this.data.x.length - 1);
    const scaleY = containerHeight / this.getMaxLinesValue(this.data.lines, 0);

    this.initViewPort = this.getViewPort(
      containerHeight,
      this.initRange,
      this.data,
      stepX,
      scaleY
    );

    if (this.useRange) {
      this.spareLines.toggle(this.initViewPort.height, this.initViewPort.y, containerWidth);
    }

    this.setViewBox(svgElem, this.initViewPort);

    const lineRefs: DataRef[] = Object.keys(this.data.lines);
    const dataX = this.data.x.map((_: never, index) => index * stepX);

    const lineGroupsData: {
      [key in DataRef]: SVGGElement
    } = lineRefs.reduce((acc, lineRef) => {
      const dataY = this.data.lines[lineRef].map((val) => containerHeight - val * scaleY);
      const lineData = combine(dataX, dataY);

      const lineGContainer = this.drawLine(
        lineData,
        svgElem,
        this.data.colors[lineRef]
      );

      return {
        ...acc,
        [lineRef]: lineGContainer
      };
    }, {});

    this.graphService.getDataModel()
      .pipe(
        skip(1),
        scan<LineGraphModel>((acc, currentModel) => {
          return {
            ...currentModel,
            activeLinesChanged: !acc.activeLines
              || acc.activeLines.length !== currentModel.activeLines.length
          };
        }, {activeLines: null} as GraphServiceModel),
        tap(({activeLines, activeLinesChanged}) => {
          if (!activeLinesChanged) {
            return;
          }

          Object.keys(lineGroupsData)
            .forEach((lineRef) => {
              lineGroupsData[lineRef].classList.toggle(
                'line-group__active',
                activeLines.indexOf(lineRef) !== -1
              );
            });
        })
      )
      .subscribe(({range, activeLines, activeLinesChanged}) => {
        if (this.useRange || activeLinesChanged) {
          const endViewPort = this.getViewPort(
            containerHeight,
            (this.useRange) ? range : this.initRange,
            this.data,
            stepX,
            scaleY,
            activeLines
          );

          if (this.useRange) {
            this.spareLines.toggle(endViewPort.height, endViewPort.y, containerWidth);
          }

          if (activeLines.length) {
            const animateAction = this.getAnimateAction(svgElem, endViewPort);
            requestAnimationFrame(animateAction);
          }
        }
      });
  }

  private setViewBox(svgElem: SVGElement, initViewPort: ViewPort) {
    this.renderer.setAttribute(
      svgElem,
      'viewBox',
      `${initViewPort.x} ${initViewPort.y} ${initViewPort.width} ${initViewPort.height}`
    );
  }

  private setupElement(svgElem: SVGElement, containerWidth: number, containerHeight: number) {
    this.renderer.setStyle(svgElem, 'width', `${containerWidth}px`);
    this.renderer.setStyle(svgElem, 'height', `${containerHeight}px`);

    this.renderer.setAttribute(
      svgElem,
      'preserveAspectRatio',
      'none'
    );

    if (this.useRange) {
      const zeroHorizLineSet = this.spareLines.createSet(svgElem, 1);
      zeroHorizLineSet.children[0]
        .setAttribute('d', `M 0 ${containerHeight - 1} H ${containerWidth}`);
      zeroHorizLineSet.classList.add(this.spareLines.activeClass);
    }
  }

  private drawLine(line: [number, number][], node: SVGElement, color: string) {
    const g: SVGGElement = this.renderer.createElement('g', 'svg');
    this.renderer.addClass(g, 'line-group');
    this.renderer.addClass(g, 'line-group__active');

    const path: SVGPathElement = this.renderer.createElement('path', 'svg');

    const pathD = line.reduce((acc, [x, y], ind) => {
      if (!ind) {
        return `M ${x} ${y} L`;
      } else {
        return `${acc} ${x} ${y}`;
      }
    }, '');

    this.renderer.setAttribute(path, 'd', pathD);
    this.renderer.setAttribute(path, 'stroke', color);
    this.renderer.setAttribute(path, 'stroke-width', '2');
    this.renderer.setAttribute(path, 'vector-effect', 'non-scaling-stroke');
    this.renderer.setAttribute(path, 'fill', 'none');

    this.renderer.appendChild(g, path);
    this.renderer.appendChild(node, g);

    return g;
  }

  private getMaxLinesValue(lines: LinesData, minInd: number, maxInd?: number, activeLines: DataRef[] = null): number {
    const indexTo = maxInd ? maxInd + 1 : undefined; // undefined is to grab array to the end
    return (activeLines || Object.keys(lines))
      .reduce((acc, lineRef) => {
        return Math.max(
          acc,
          ...lines[lineRef].slice(minInd, indexTo)
        );
      }, 0);
  }

  private getViewPort(
    containerHeight: number,
    range: RangeData,
    data: GraphData,
    stepX: number,
    stepY: number,
    activeLines: DataRef[] = null
  ): ViewPort {
    const minXInd = Math.ceil((data.x.length - 1) * range.minValue / 100);
    const maxXInd = Math.floor((data.x.length - 1) * range.maxValue / 100);

    const minX = minXInd * stepX;
    const maxX = maxXInd * stepX;

    const maxLinesVisibleValue = this.getMaxLinesValue(data.lines, minXInd, maxXInd, activeLines);
    const viewHeight = maxLinesVisibleValue * stepY;

    return {
      x: minX,
      y: containerHeight - viewHeight,
      width: maxX - minX,
      height: viewHeight
    };
  }

  private getAnimateAction(svgElem: SVGElement, endViewPort: ViewPort) {
    const startViewPort = {...this.initViewPort};
    const durationMs = animationTimeMs;
    const timeStart = performance.now();

    const viewPortsEq = (vp1: ViewPort, vp2: ViewPort) => {
      return vp1.x === vp2.x && vp1.y === vp2.y
        && vp1.width === vp2.width && vp1.height === vp1.width;
    };
    const ctx = this;

    let prevViewPort = {...startViewPort};

    return function animate(time: number) {
      const diffTime = time - timeStart;

      const currViewPort = {...prevViewPort};
      if (diffTime > 0) {
        const progress = diffTime / durationMs;
        currViewPort.x = startViewPort.x + (endViewPort.x - startViewPort.x) * progress;
        currViewPort.y = startViewPort.y + (endViewPort.y - startViewPort.y) * progress;
        currViewPort.width = startViewPort.width + (endViewPort.width - startViewPort.width) * progress;
        currViewPort.height = startViewPort.height + (endViewPort.height - startViewPort.height) * progress;
      }

      if (!viewPortsEq(currViewPort, prevViewPort)) {
        prevViewPort = {...currViewPort};

        if (
          time > (timeStart + durationMs)
        ) {
          ctx.initViewPort = {...currViewPort};
          return;
        }

        svgElem.setAttribute(
          'viewBox',
          `${currViewPort.x} ${currViewPort.y} ${currViewPort.width} ${currViewPort.height}`
        );
      }

      requestAnimationFrame(animate);
    };
  }
}
