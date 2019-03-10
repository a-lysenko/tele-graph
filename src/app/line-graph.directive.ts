import {AfterViewInit, Directive, ElementRef, Input, Renderer2} from '@angular/core';

interface GraphLines {
  columns: number[];
  values: number[][];
}

@Directive({
  selector: '[tgLineGraph]'
})
export class LineGraphDirective implements AfterViewInit {

  @Input('tgLineGraph') data: GraphLines;

  constructor(
    private elem: ElementRef,
    private renderer: Renderer2
  ) {
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.elem.nativeElement, 'width', '100%');
    this.renderer.setStyle(this.elem.nativeElement, 'height', '100%');

    this.drawLine(
      [
        [10, 10],
        [100, 100],
        [200, 200],
        [300, 100]
      ],
      this.elem.nativeElement
    );
  }

  private getWH(elem: SVGElement) {
    return elem.getBoundingClientRect();
  }

  private drawLine(line: [number, number][], node: SVGElement) {
    const path: SVGPathElement = this.renderer.createElement('path');

    const pathD = line.reduce((acc, [x, y], ind) => {
      if (!ind) {
        return `M ${x} ${y} L`;
      } else {
        return `${acc} ${x} ${y}`;
      }
    }, '');

    this.renderer.setAttribute(path, 'd', pathD);
    this.renderer.appendChild(node, path);
  }
}
