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
    const dataY = this.data.lines[mockDataRefs[0]].map((val) => val * scaleY);

    const line0Data = combine(dataX, dataY);

    this.drawLine(
      line0Data,
      this.elem.nativeElement
    );
  }

  private getWH(elem: SVGElement) {
    return elem.getBoundingClientRect();
  }

  private drawLine(line: [number, number][], node: SVGElement) {
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
    this.renderer.setAttribute(path, 'fill', 'none');
    this.renderer.appendChild(node, path);
  }
}
