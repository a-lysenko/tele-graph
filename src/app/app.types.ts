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

export interface GraphData {
  x: number[];
  lines: {
    [key in DataRef]: number[]
  };
}
