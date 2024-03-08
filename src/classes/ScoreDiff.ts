import { PartDiff } from "./PartDiff";
import { Score } from "./Score";


export class ScoreDiff {
  public partDiffs: PartDiff[];

  constructor(a: Score, b: Score) {
    let partNames = Array.from(new Set(a.partNames.concat(b.partNames)));
    this.partDiffs = partNames.map((partName) => {
      let partA = a.parts.find((part) => part.name === partName)!;
      let partB = b.parts.find((part) => part.name === partName)!;
      return new PartDiff(partName, partA, partB);
    });
  }

  getPartDiffByName(name: string): PartDiff | null {
    return this.partDiffs.find((partDiff) => partDiff.name === name) || null;
  }
}
