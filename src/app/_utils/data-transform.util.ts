import {Column, DataRef, DataType, GraphData, RefType} from '../app.types';

export const flatColumns = (columns: Column[], types: RefType): GraphData => {
  const xRef: DataRef = Object.keys(types).find((dataRef) => types[dataRef] === DataType.x);
  const lineRefs: DataRef[] = Object.keys(types).filter((dataRef) => types[dataRef] === DataType.line);

  return {
    x: columns
      .find(([dataRef]) => dataRef === xRef)
      .slice(1) as number[],
    lines: lineRefs.reduce<{ [key in DataRef]: number[] }>((acc, lineRef) => {
      return {
        ...acc,
        [lineRef]: columns.find(([dataRef]) => dataRef === lineRef)
          .slice(1) as number[]
      };
    }, {})
  };
};

export const combine = <T, U>(arr1: T[], arr2: U[]) => {
  return arr1.map((val1, ind1) => {
    return [
      val1,
      arr2[ind1]
    ] as [T, U];
  });
};

