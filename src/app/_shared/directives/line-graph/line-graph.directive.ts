import {AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {DataRef, GraphData, LinesData, RangeData} from '../../../app.types';
import {combine} from '../../../_utils/data-transform.util';
import {GraphService, GraphServiceModel} from '../../../services/graph.service';
import {filter, scan, skip, take, tap} from 'rxjs/operators';
import {animationTimeMs} from '../../../app.constants';

interface ViewPort {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewPortData extends ViewPort {
  maxLinesVisibleValue: number;
}

interface LineGraphModel extends GraphServiceModel {
  activeLinesChanged?: boolean;
}

class SpareLines {

  readonly activeClass = 'horiz-line-group__active';
  private sets: SVGGElement[] = [];
  private activeSet: SVGGElement;
  private activeSetInd = -1;
  private prevMaxDataValue: number;

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

  toggleSet(
    maxDataValue: number,
    viewHeight: number,
    viewShift: number,
    width: number
  ) {
    if (!maxDataValue
      || this.prevMaxDataValue === maxDataValue) {
      return;
    }

    this.prevMaxDataValue = maxDataValue;
    if (this.activeSet) {
      this.activeSet.classList.remove(this.activeClass);
    }

    this.activeSetInd = (this.activeSetInd + 1) % this.sets.length;
    this.activeSet = this.sets[this.activeSetInd];

    const viewToDataRatio = viewHeight / maxDataValue;
    const valueSteps = this.getValueSteps(maxDataValue, this.set.setBy);

    const lines = this.activeSet.querySelectorAll('path');
    const textItems = this.activeSet.querySelectorAll('text');
    valueSteps.forEach((valueStep, index) => {
      const lineYVal = viewHeight + viewShift - valueStep * viewToDataRatio;
      lines[index].setAttribute('d', `M 0 ${lineYVal} H ${width}`);

      textItems[index].setAttribute('y', `${lineYVal - 5}`);
      textItems[index].textContent = '' + parseFloat(valueStep.toFixed(3));
    });

    this.activeSet.classList.add(this.activeClass);
  }

  createSet(hostElem: SVGElement, setBy: number, defaultText = '') {
    const gSet: SVGGElement = this.renderer.createElement('g', 'svg');
    this.renderer.addClass(gSet, 'horiz-line-group');

    for (let i = 0; i < setBy; i++) {
      const text: SVGTextElement = this.renderer.createElement('text', 'svg');
      this.renderer.setAttribute(text, 'x', '5');
      this.renderer.setAttribute(text, 'y', '');
      this.renderer.setAttribute(text, 'vector-effect', 'non-scaling-stroke');
      this.renderer.setAttribute(text, 'stroke', 'none');
      text.textContent = defaultText;

      const path: SVGPathElement = this.renderer.createElement('path', 'svg');
      this.renderer.setAttribute(path, 'd', '');
      // this.renderer.setAttribute(path, 'stroke', color);
      this.renderer.setAttribute(path, 'stroke-width', '0.7');
      this.renderer.setAttribute(path, 'vector-effect', 'non-scaling-stroke');
      this.renderer.setAttribute(path, 'fill', 'none');

      this.renderer.appendChild(gSet, text);
      this.renderer.appendChild(gSet, path);
      this.renderer.appendChild(hostElem, gSet);
    }

    return gSet;
  }

  private getValueSteps(viewValue: number, setBy: number): number[] {
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
    const yStep = maxY / setBy;

    return (new Array(setBy))
      .fill(null)
      .map((_, ind) => {
        return yStep * (ind + 1);
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

interface SpareDateSet {
  group: SVGGElement;
  first: SVGTextElement;
  last: SVGTextElement;
  medium: SVGTextElement[];
  mediumActive: SVGTextElement[];
}

class SpareDates {

  readonly activeClass = 'date-group__active';
  readonly activeTextClass = 'date-text__active';
  private sets: SpareDateSet[] = [];
  private activeSet: SpareDateSet;
  private activeSetInd = -1;
  private prevMinMaxDateHash: string;

  constructor(
    private hostElem: SVGElement,
    private viewShift: number,
    private containerWidth: number,
    private set: { setsAmount: number, setBy: number },
    private renderer: Renderer2,
  ) {
    for (let setInd = 0; setInd < this.set.setsAmount; setInd++) {
      this.sets.push(
        this.createSet(this.hostElem, this.set.setBy)
      );
    }
  }

  toggleDateSet(textList: number[], maxDotsToShow = this.set.setBy) {
    const minMaxDateHash = textList.slice(0, 1)[0] + '#' + textList.slice(-1)[0];
    if (this.prevMinMaxDateHash === minMaxDateHash) {
      return;
    }

    this.prevMinMaxDateHash = minMaxDateHash;
    if (this.activeSet) {
      this.activeSet.group.classList.remove(this.activeClass);
    }

    this.activeSetInd = (this.activeSetInd + 1) % this.sets.length;
    this.activeSet = this.sets[this.activeSetInd];

    this.activeSet.medium.forEach((mediumActiveText) => {
      mediumActiveText.classList.remove(this.activeTextClass);
    });

    const msxGroupsToSplitTo = maxDotsToShow - 1;
    const groupsToSplitInto = this.countGroupsToShow(textList.length, msxGroupsToSplitTo);
    const amountToSkip = (textList.length - 2 - (groupsToSplitInto - 1)) / groupsToSplitInto;

    const countMediumActive = groupsToSplitInto - 1;
    this.activeSet.mediumActive = this.activeSet.medium.slice(0, countMediumActive);

    const stepX = (countMediumActive) ? this.containerWidth / groupsToSplitInto : 0;
    this.activeSet.first.textContent = '' + textList[0];
    this.activeSet.last.textContent = '' + textList[textList.length - 1];
    this.activeSet.mediumActive.forEach((mediumActiveText, mediumInd) => {
      mediumActiveText.textContent = '' + textList[1 + mediumInd + amountToSkip * (mediumInd + 1)];
      mediumActiveText.setAttribute('x', '' + stepX * (mediumInd + 1));

      mediumActiveText.classList.add(this.activeTextClass);
    });

    this.activeSet.group.classList.add(this.activeClass);
  }

  createSet(hostElem: SVGElement, setBy: number, textItems: string[] = []): SpareDateSet {
    const gSet: SVGGElement = this.renderer.createElement('g', 'svg');
    this.renderer.addClass(gSet, 'date-group');

    const createdSet: SpareDateSet = {
      group: gSet,
      first: null,
      last: null,
      medium: [],
      mediumActive: []
    };

    for (let i = 0; i < setBy; i++) {
      const text: SVGTextElement = this.renderer.createElement('text', 'svg');
      this.renderer.setAttribute(text, 'y', '' + this.viewShift);
      this.renderer.setAttribute(text, 'vector-effect', 'non-scaling-stroke');
      this.renderer.setAttribute(text, 'stroke', 'none');
      text.textContent = textItems[i] || '';

      this.renderer.appendChild(gSet, text);
      this.renderer.appendChild(hostElem, gSet);

      if (i === 0) {
        this.renderer.setAttribute(text, 'x', '0');
        this.renderer.setAttribute(text, 'text-anchor', 'start');
        this.renderer.addClass(text, this.activeTextClass);
        createdSet.first = text;
      } else if (i === (setBy - 1)) {
        this.renderer.setAttribute(text, 'x', '' + this.containerWidth);
        this.renderer.setAttribute(text, 'text-anchor', 'end');
        this.renderer.addClass(text, this.activeTextClass);
        createdSet.last = text;
      } else {
        this.renderer.setAttribute(text, 'x', '');
        this.renderer.setAttribute(text, 'text-anchor', 'middle');
        createdSet.medium.push(text);
      }
    }

    return createdSet;
  }

  private canDivide(num: number, groupsNum: number) {
    // 2 - for first/last boundary points
    // (num - 2 - (divider - 1) ) / divider = k
    const amountInGroup = (num - 2 - (groupsNum - 1)) / groupsNum;
    return amountInGroup === Math.round(amountInGroup);
  }

  private countGroupsToShow(num: number, maxGroups: number) {
    for (let groupsNum = maxGroups; groupsNum > 0; groupsNum--) {
      if (this.canDivide(num, groupsNum)) {
        return groupsNum;
      }
    }

    // It may not happen
    return 0;
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
  private initViewPort: ViewPortData = null;
  private spareLines: SpareLines;
  private spareDates: SpareDates;

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
    const topOffsetPx = this.useRange ? 40 : 0;
    const bottomOffsetPx = this.useRange ? 20 : 0;
    const parentSvgElem = this.elem.nativeElement;
    const svgElem = this.addSVGElem(parentSvgElem);

    const parentContainerRect = parentSvgElem.parentElement.getBoundingClientRect();
    const parentSvgHeight = parentContainerRect.height;
    const parentSvgWidth = parentContainerRect.width;

    const graphContainerHeight = parentSvgHeight - topOffsetPx - bottomOffsetPx;

    this.setupElement(parentSvgElem, parentSvgWidth, parentSvgHeight, false);
    this.setupElement(svgElem,
      parentSvgWidth,
      graphContainerHeight,
      true,
      topOffsetPx);

    if (this.useRange) {
      this.spareLines = new SpareLines(
        parentSvgElem,
        {setsAmount: 2, setBy: 5},
        this.renderer);

      const zeroHorizLineSet = this.spareLines.createSet(parentSvgElem, 1, '0');
      zeroHorizLineSet.querySelector('text')
        .setAttribute('y', `${parentSvgHeight - bottomOffsetPx - 5}`);
      zeroHorizLineSet.querySelector('path')
        .setAttribute('d', `M 0 ${parentSvgHeight - bottomOffsetPx - 1} H ${parentSvgWidth}`);
      zeroHorizLineSet.classList.add(this.spareLines.activeClass);

      this.spareDates = new SpareDates(
        parentSvgElem,
        parentSvgHeight - 5,
        parentSvgWidth,
        {setsAmount: 2, setBy: 7},
        this.renderer
      );
    }

    const stepX = parentSvgWidth / (this.data.x.length - 1);
    const scaleY = graphContainerHeight / this.getMaxLinesValue(this.data.lines, 0);

    this.initViewPort = this.getViewPort(
      graphContainerHeight,
      this.initRange,
      this.data,
      stepX,
      scaleY,
      null,
      topOffsetPx,
      bottomOffsetPx
    );

    if (this.useRange) {
      this.spareLines.toggleSet(
        this.initViewPort.maxLinesVisibleValue,
        graphContainerHeight,
        topOffsetPx,
        parentSvgWidth
      );

      const visibleDataX = this.getVisibleDataX(this.data.x, this.initRange);
      this.spareDates.toggleDateSet(visibleDataX);
    }

    this.setViewBox(svgElem, this.initViewPort);

    const lineRefs: DataRef[] = Object.keys(this.data.lines);
    const dataX = this.data.x.map((_: never, index) => index * stepX);

    const lineGroupsData: {
      [key in DataRef]: SVGGElement
    } = lineRefs.reduce((acc, lineRef) => {
      const dataY = this.data.lines[lineRef].map((val) => graphContainerHeight - val * scaleY);
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
            graphContainerHeight,
            (this.useRange) ? range : this.initRange,
            this.data,
            stepX,
            scaleY,
            activeLines,
            topOffsetPx,
            bottomOffsetPx
          );

          if (this.useRange) {
            this.spareLines.toggleSet(
              endViewPort.maxLinesVisibleValue,
              graphContainerHeight,
              topOffsetPx,
              parentSvgWidth);

            const visibleDataX = this.getVisibleDataX(this.data.x, range);
            this.spareDates.toggleDateSet(visibleDataX);
          }

          if (activeLines.length) {
            const animateAction = this.getAnimateAction(svgElem, endViewPort);
            requestAnimationFrame(animateAction);
          }
        }
      });
  }

  private setViewBox(svgElem: SVGElement, viewPort: ViewPort) {
    this.renderer.setAttribute(
      svgElem,
      'viewBox',
      `${viewPort.x} ${viewPort.y} ${viewPort.width} ${viewPort.height}`
    );
  }

  private setupElement(
    svgElem: SVGElement,
    containerWidth: number,
    containerHeight: number,
    setPreserveAspectRatio,
    topOffset = 0
  ) {
    this.renderer.setStyle(svgElem, 'width', `${containerWidth}px`);
    this.renderer.setStyle(svgElem, 'height', `${containerHeight}px`);
    if (topOffset) {
      this.renderer.setAttribute(svgElem, 'y', '' + topOffset);
    }

    if (setPreserveAspectRatio) {
      this.renderer.setAttribute(
        svgElem,
        'preserveAspectRatio',
        'none'
      );
    }
  }

  private addSVGElem(parentElem: HTMLOrSVGElement) {
    const svgElem: SVGSVGElement = this.renderer.createElement('svg', 'svg');
    this.renderer.appendChild(parentElem, svgElem);

    return svgElem;
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
    activeLines: DataRef[] = null,
    topOffsetPx = 0,
    bottomOffsetPx = 0
  ): ViewPortData {
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
      height: viewHeight + topOffsetPx + bottomOffsetPx,
      maxLinesVisibleValue
    };
  }

  private getVisibleDataX(dataX: number[], range: RangeData) {
    const minXInd = Math.ceil((dataX.length - 1) * range.minValue / 100);
    const maxXInd = Math.floor((dataX.length - 1) * range.maxValue / 100);
    return dataX.slice(minXInd, maxXInd + 1);
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
