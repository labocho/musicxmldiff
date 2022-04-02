<template>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
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
        <li v-for="d, index in diff.digestDiffs" :key="index">
          <h4>A[{{d.aFrom}}...{{d.aBefore}}] is different from B[{{d.bFrom}}...{{d.bBefore}}]</h4>
          <div v-html="udiffToHTML(udiff(d.aMeasures, d.bMeasures))"></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import {diff} from "fast-myers-diff";
import * as diff2html from "diff2html";
import {createTwoFilesPatch} from "diff";

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
      let digestDiff = {
        aFrom: vec4[0],
        aBefore: vec4[1],
        bFrom: vec4[2],
        bBefore: vec4[3],
        aMeasures: a.measures.slice(vec4[0], vec4[1]),
        bMeasures: b.measures.slice(vec4[2], vec4[3]),
      }
      return digestDiff;
    });
  }
}


class Score {
  private document: Document;
  public numberOfMeasures: number;
  public partList: string[];
  public digests: string[];
  public loaded: boolean;
  public measures: Element[];
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
    this.measures = Array.from(this.document.querySelectorAll("part#P1 > measure"));

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
        this.measures,
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
  filters: {
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
    udiff(aMeasures, bMeasures) {
        let a = [];
        let b = [];

        for (let m of aMeasures) {
          a.push(m.outerHTML)
        }

        for (let m of bMeasures) {
          b.push(m.outerHTML)
        }

        return createTwoFilesPatch(
          "left",
          "right",
          a.join(""),
          b.join(""),
        );
    },
    udiffToHTML(udiff) {
      return diff2html.html(udiff, {outputFormat: "side-by-side"});
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
