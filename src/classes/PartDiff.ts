import { diff } from "fast-myers-diff";
import { DigestDiff } from "../interfaces/DigestDiff"
import { Part } from "./Part"
import type { Measure } from "./Measure"

interface MeaureNumbers {
  from: string|null,
  to: string|null,
}

export function getMeasureNumbers(measures: Measure[]): MeaureNumbers {
  if (measures.length === 0) return {from: null, to: null};

  return {
    from: measures[0].raw.getAttribute("number"),
    to: measures[measures.length - 1].raw.getAttribute("number"),
  }
}

export class PartDiff {
  public digestDiffs: DigestDiff[];
  public name: string;

  constructor(name: string, a: Part | null, b: Part | null) {
    this.name = name;

    let aDigests = a === null ? [] : a.digests;
    let bDigests = b === null ? [] : b.digests;

    let aMeasures = a === null ? [] : a.measures;
    let bMeasures = b === null ? [] : b.measures;

    this.digestDiffs = Array.from(diff(aDigests, bDigests)).map((vec4) => {
      let digestDiff = {
        aFrom: vec4[0],
        aBefore: vec4[1],
        bFrom: vec4[2],
        bBefore: vec4[3],
        aMeasures: aMeasures.slice(vec4[0], vec4[1]),
        bMeasures: bMeasures.slice(vec4[2], vec4[3]),
        aMeasureNumbers: null as MeaureNumbers|null,
        bMeasureNumbers: null as MeaureNumbers|null,
      };

      digestDiff.aMeasureNumbers = getMeasureNumbers(digestDiff.aMeasures);
      digestDiff.bMeasureNumbers = getMeasureNumbers(digestDiff.bMeasures);

      return digestDiff;
    });
  }
}
