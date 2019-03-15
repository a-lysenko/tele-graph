import {AfterViewInit, Directive, ElementRef, Input, Renderer2} from '@angular/core';
import {DataRef, GraphData} from '../../../app.types';
import {combine} from '../../../_utils/data-transform.util';

@Directive({
  selector: '[tgLineGraph]'
})
export class LineGraphDirective implements AfterViewInit {

  @Input('tgLineGraph') data: GraphData;

  constructor(
    private elem: ElementRef<SVGElement>,
    private renderer: Renderer2
  ) {
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.elem.nativeElement, 'width', '100%');
    this.renderer.setStyle(this.elem.nativeElement, 'height', '100%');

    const mockDataRefs: DataRef[] = ['y0'];

    const containerRect = this.elem.nativeElement.getBoundingClientRect();

    const stepX = containerRect.width / (this.data.x.length - 1);
    const dataX = this.data.x.map((_: never, index) => index * stepX);

    const scaleY = containerRect.height / Math.max(...this.data.lines[mockDataRefs[0]]);
    const dataY = this.data.lines[mockDataRefs[0]].map((val) => containerRect.height - val * scaleY);

    const line0Data = combine(dataX, dataY);

    const gContainer = this.drawLine(
      line0Data,
      this.elem.nativeElement
    );

    setTimeout(() => {
      this.setTransform(gContainer, ['translateX', '100px']);
    }, 2000);
    setTimeout(() => {
      this.setTransform(gContainer, ['scaleY', '1.5'], true);
    }, 4000);
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
    this.renderer.setAttribute(path, 'stroke', 'black');
    this.renderer.setAttribute(path, 'stroke-width', '1.5');
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
