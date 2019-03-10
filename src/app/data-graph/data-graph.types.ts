enum DataRef {
  x,
  y0,
  y1,
  y2,
  y3,
  y4,
  y5
}

enum DataType {
  line,
  x
}
type LineName = string;

type LineColor = string;

type Column = [DataRef, number];

type RefType = {
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
