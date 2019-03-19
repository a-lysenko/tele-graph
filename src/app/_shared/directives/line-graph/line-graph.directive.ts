import {AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {DataRef, GraphData, RangeData} from '../../../app.types';
import {combine} from '../../../_utils/data-transform.util';
import {GraphService} from '../../../services/graph.service';
import {skip, take} from 'rxjs/operators';

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

  private initRange: RangeData = null;

  constructor(
    private elem: ElementRef<SVGElement>,
    private renderer: Renderer2,
    private graphService: GraphService
  ) {
  }

  ngOnInit(): void {
    this.graphService.getDataModel()
      .pipe(take(1))
      .subscribe((val) => {
        console.log('val', val);
        this.initRange = {...val.range};
      });
  }

  ngAfterViewInit(): void {
    const svgElem = this.elem.nativeElement;
    const containerRect = svgElem.parentElement.getBoundingClientRect();

    let initViewPort = {
      x: 0,
      y: 0,
      width: containerRect.width,
      height: containerRect.height
    };

    this.renderer.setStyle(svgElem, 'width', `${containerRect.width}px`);
    this.renderer.setStyle(svgElem, 'height', `${containerRect.height}px`);

    this.renderer.setAttribute(
      svgElem,
      'viewBox',
      `${initViewPort.x} ${initViewPort.y} ${initViewPort.width} ${initViewPort.height}`
    );
    this.renderer.setAttribute(
      svgElem,
      'preserveAspectRatio',
      'none'
    );

    const mockDataRefs: DataRef[] = ['y0'];

    const stepX = containerRect.width / (this.data.x.length - 1);
    const dataX = this.data.x.map((_: never, index) => index * stepX);

    const scaleY = containerRect.height / Math.max(...this.data.lines[mockDataRefs[0]]);
    const dataY = this.data.lines[mockDataRefs[0]].map((val) => containerRect.height - val * scaleY);

    const line0Data = combine(dataX, dataY);

    const gContainer = this.drawLine(
      line0Data,
      svgElem
    );

    const endViewPort = {
      x: 0,
      y: -containerRect.height / 4,
      width: containerRect.width,
      height: containerRect.height * 1.25
    };

    let prevViewPort = {
      ...initViewPort
    };

    const durationMs = 200;

    let timeStart = performance.now();

    const viewPortsEq = (vp1: ViewPort, vp2: ViewPort) => {
      return vp1.x === vp2.x && vp1.y === vp2.y
        && vp1.width === vp2.width && vp1.height === vp1.width;
    };

    function animate(time) {
      const diffTime = time - timeStart;

      const currViewPort = {...prevViewPort};
      if (diffTime > 0) {
        const progress = diffTime / durationMs;
        currViewPort.x = initViewPort.x + (endViewPort.x - initViewPort.x) * progress;
        currViewPort.y = initViewPort.y + (endViewPort.y - initViewPort.y) * progress;
        currViewPort.width = initViewPort.width + (endViewPort.width - initViewPort.width) * progress;
        currViewPort.height = initViewPort.height + (endViewPort.height - initViewPort.height) * progress;
      }

      if (!viewPortsEq(currViewPort, prevViewPort)) {
        prevViewPort = {...currViewPort};

        // console.log('### currViewPort', currViewPort, 'diffTime', diffTime);

        if (
          time > (timeStart + durationMs)
        ) {
          console.log('####### STOP');
          initViewPort = {...currViewPort};
          return;
        }

        svgElem.setAttribute(
          'viewBox',
          `${currViewPort.x} ${currViewPort.y} ${currViewPort.width} ${currViewPort.height}`
        );
      }

      requestAnimationFrame(animate);
    }

    this.graphService.getDataModel()
      .pipe(
        skip(1),
      )
      .subscribe(({range}) => {
        timeStart = performance.now();
        console.log('########### START');
        requestAnimationFrame(animate);
      });
  }

  private getWH(elem: SVGElement) {
    return elem.getBoundingClientRect();
  }

  private drawLine(line: [number, number][], node: SVGElement) {
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
    this.renderer.setAttribute(path, 'stroke', 'coral');
    this.renderer.setAttribute(path, 'stroke-width', '2');
    this.renderer.setAttribute(path, 'vector-effect', 'non-scaling-stroke');
    this.renderer.setAttribute(path, 'fill', 'none');

    this.renderer.appendChild(g, path);
    this.renderer.appendChild(node, g);

    return g;
  }

  private setTransform(node: SVGGraphicsElement, [operator, value]: [string, string], keepPrev = false) {
    console.log('setTransform value to set', value);

    const usedTOperatorsAttr = node.getAttribute('used-t-operators') || '';
    const usedTOperators = usedTOperatorsAttr.split(';');

    if (!keepPrev) {
      usedTOperators.filter((usedTOperator) => usedTOperator !== operator)
        .forEach((usedOperator) => {
          node.setAttribute(`used-t-${operator.toLowerCase()}`, null);
        });

      node.setAttribute('used-t-operators', operator);
      node.setAttribute(`used-t-${operator.toLowerCase()}`, value);

      node.style.transform = `${operator}(${value})`;
    } else {
      if (usedTOperators.indexOf(operator) === -1) {
        usedTOperators.push(operator);
      }

      node.setAttribute('used-t-operators', usedTOperators.join(';'));
      node.setAttribute(`used-t-${operator.toLowerCase()}`, value);

      const transformValue = usedTOperators.reduce((acc, usedOperator) => {
        const usedOperatorValue = (usedOperator === operator)
          ? value
          : node.getAttribute(`used-t-${usedOperator.toLowerCase()}`);
        return `${acc} ${usedOperator}(${usedOperatorValue})`;
      }, '');

      node.style.transform = transformValue;
    }
  }
}
