import {AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {DataRef, GraphData, LinesData, RangeData} from '../../../app.types';
import {combine} from '../../../_utils/data-transform.util';
import {GraphService} from '../../../services/graph.service';
import {filter, skip, take} from 'rxjs/operators';
import {animationTimeMs} from '../../../app.constants';

interface ViewPort {
  x: number;
  y: number;
  width: number;
  height: number;
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

    this.setViewBox(svgElem, this.initViewPort);

    const lineRefs: DataRef[] = Object.keys(this.data.lines);
    const dataX = this.data.x.map((_: never, index) => index * stepX);

    const lineGroupsData: {
      [key in DataRef]: SVGGElement[]
    } = lineRefs.reduce((acc, lineRef) => {
      const dataY = this.data.lines[lineRef].map((val) => containerHeight - val * scaleY);
      const lineData = combine(dataX, dataY);

      return this.drawLine(
        lineData,
        svgElem,
        this.data.colors[lineRef]
      );
    }, {});

    this.graphService.getDataModel()
      .pipe(
        skip(1),
      )
      .subscribe(({range}) => {
        if (this.useRange) {
          const endViewPort = this.getViewPort(
            containerHeight,
            range,
            this.data,
            stepX,
            scaleY)
          ;
          const animateAction = this.getAnimateAction(svgElem, endViewPort);

          // console.log('########### START, range', range);
          requestAnimationFrame(animateAction);
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
  }

  private drawLine(line: [number, number][], node: SVGElement, color: string) {
    const g: SVGGElement = this.renderer.createElement('g', 'svg');
    this.renderer.addClass(g, 'animated-group');

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

  private getMaxLinesValue(lines: LinesData, minInd: number, maxInd?: number): number {
    const indexTo = maxInd ? maxInd + 1 : undefined; // undefined is to grad array to the end
    return Object.keys(lines)
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
    stepY: number
  ): ViewPort {
    const minXInd = Math.ceil(data.x.length * range.minValue / 100);
    const maxXInd = Math.floor(data.x.length * range.maxValue / 100);

    const minX = minXInd * stepX;
    const maxX = maxXInd * stepX;

    const maxLinesVisibleValue = this.getMaxLinesValue(data.lines, minXInd, maxXInd);
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
          // console.log('####### STOP');
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
