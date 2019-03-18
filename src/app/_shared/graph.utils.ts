import {GraphData, LineTypedData} from '../app.types';

const srcData = {
  x: [1, 3, 7],
  lines: {
    y0: [4, 44, 444],
    y1: [4, 23, 42],
    y2: [4, 660, 108900]
  }
};

/*
  returns {

    lines: {
      y0: [{x1, x2, y1, y2}, ...],
      y1: ...
    }
  }
*/
export const getLineTypeData = (src: GraphData): LineTypedData => {
  const linesKeys = Object.keys(src.lines);
  const initLines = linesKeys.reduce((acc, lineKey) => {
    return {
      ...acc,
      [lineKey]: []
    };
  }, {});

  return src.x.reduce((acc, xVal, ind, source) => {
    if ((source.length - 1) === ind) {
      return {...acc};
    }

    const updatedAccLines = linesKeys.reduce((accLines, lineKey) => {
      return {
        ...accLines,
        [lineKey]: [
          ...accLines[lineKey],
          {
            x1: xVal,
            x2: source[ind + 1],
            y1: src.lines[lineKey][ind],
            y2: src.lines[lineKey][ind + 1]
          }
        ]
      };
    }, acc.lines);

    return {
      lines: updatedAccLines
    };
  }, {lines: initLines});
};

const destData = getLineTypeData(srcData);
console.log('destData', destData);
