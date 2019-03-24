export type DataRef = string;

export enum DataType {
  line = 'line',
  x = 'x'
}

type LineName = string;
type LineColor = string;

export type Column = [DataRef, number];
export type RefType = {
  [key in DataRef]: DataType;
};
type NameType = {
  [key in DataRef]: LineName;
};
type ColorType = {
  [key in DataRef]: LineColor;
};

export interface DataItem {
  columns: Column[];
  types: RefType;
  names: NameType;
  colors: ColorType;
}

export type LinesData = {
  [key in DataRef]: number[]
};

export interface FlatColumns {
  x: any[];
  lines: LinesData;
}

export interface GraphData extends FlatColumns {
  colors: ColorType;
  names: NameType;
}

export interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineTypedData {
  lines: {
    [key in DataRef]: LineData[]
  };
}

export interface RangeData {
  minValue: number;
  maxValue: number;
}
