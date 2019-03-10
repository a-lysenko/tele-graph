import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewGraphComponent } from './overview-graph.component';

describe('OverviewGraphComponent', () => {
  let component: OverviewGraphComponent;
  let fixture: ComponentFixture<OverviewGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverviewGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
