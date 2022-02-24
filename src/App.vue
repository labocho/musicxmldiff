<template>
  <div>
    <input type="file" @change="changeFile($event, 'A')" />
    <input type="file" @change="changeFile($event, 'B')" />
    <div v-if="scoreA">
      <code>{{scoreA.numberOfMeasures}}</code>
      <ul>
        <li v-for="part in scoreA.partList" :key="part">{{part}}</li>
      </ul>
    </div>
    <div v-if="scoreB">
      <code>{{scoreB.numberOfMeasures}}</code>
      <ul>
        <li v-for="part in scoreB.partList" :key="part">{{part}}</li>
      </ul>
    </div>
    <div v-if="diff">
      <ul>
        <li v-for="d, index in diff.digestDiffs" :key="index">A[{{d.aFrom}}...{{d.aBefore}}] is different from B[{{d.bFrom}}...{{d.bBefore}}]</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import {diff} from "fast-myers-diff";

interface DigestDiff {
  aFrom: number
  aBefore: number
  bFrom: number
  bBefore: number
}

class ScoreDiff {
  public a: Score;
  public b: Score;
  public digestDiffs: DigestDiff[]

  constructor(a: Score, b: Score) {
    // this.digestDiffs = Array.prototype.map.call(diff(a.digests, b.digests), (e)=> e);
    this.digestDiffs = Array.from(diff(a.digests, b.digests)).map((vec4) => {
      return {
        aFrom: vec4[0],
        aBefore: vec4[1],
        bFrom: vec4[2],
        bBefore: vec4[3],
      }
    });
  }
}


class Score {
  private document: Document;
  public numberOfMeasures: number;
  public partList: string[];
  public digests: string[];
  public loaded: boolean;
  private _measures: NodeListOf<Element>;
  private update: (score: Score) => void;

  constructor(xmlString: string, update: (score: Score)=> void) {
    this.loaded = false;
    this.update = update;
    this.document = new DOMParser().parseFromString(xmlString, "text/xml");
    this.numberOfMeasures = this.document.querySelectorAll("measure").length;
    this.partList = Array.prototype.map.call(
      this.document.querySelectorAll("part-list > score-part > part-name"),
      (el: Element) => el.textContent,
    );
    this._measures = this.document.querySelectorAll("part#P1 > measure");

    this.digests = [];
    this.calculateDigest().then((digests) => {
      this.digests = digests;
      this.loaded = true;
      this.update(this);
    })
  }

  private stringToBuffer(s: string) {
    return new Uint16Array(Array.prototype.map.call(s, (c: string) => c.charCodeAt(0))).buffer;
  }

  private bufferToString(ab: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint16Array(ab));
  }

  private async calculateDigest(): Promise<string[]> {
    const subtle = window.crypto.subtle;
    return await Promise.all(
      Array.prototype.map.call(
        this._measures,
        async (m: Element) => {
          const ab = await subtle.digest("SHA-256", this.stringToBuffer(m.outerHTML));
          return this.bufferToString(ab);
        }
      ),
    );
  }
}

export default {
  data() {
    return {
      name: "Vue" as String,
      fileContentA: null,
      fileContentB: null,
      scoreA: null,
      scoreB: null,
      diff: null,
    };
  },
  methods: {
    changeFile(e, identifier) {
      const reader = new FileReader();
      reader.readAsText(e.currentTarget.files[0]);
      reader.onload = (e2) => {
        const xmlString = e2.target.result as string;
        let score = null;
        if (xmlString !== null) score = new Score(xmlString, (score: Score) => this.updateScore(score, identifier));

        this[`fileContent${identifier}`] = xmlString;
        this[`score${identifier}`] = score;
      };
    },
    updateScore(score: Score, identifier: string) {
      this[`score${identifier}`] = Object.assign({}, score);
      if (this.scoreA && this.scoreA.loaded && this.scoreB && this.scoreB.loaded) {
        this.diff = new ScoreDiff(this.scoreA, this.scoreB);
      } else {
        this.diff = null;
      }
    },
  },
};
</script>
