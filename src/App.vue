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
        <Diff v-for="d, index in diff.digestDiffs" :diff="d" :key="index" />
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import {diff} from "fast-myers-diff";
import Diff from "./Diff.vue";

interface DigestDiff {
  aFrom: number
  aBefore: number
  bFrom: number
  bBefore: number
}

interface Ignores {
  elements: string[]
  attributes: {selector: string, attributes: string[] }[]
}


function getMeasureNumbers(measures): {from: string|null, to: string|null} {
  if (measures.length === 0) return {from: null, to: null};

  return {
    from: measures[0].raw.getAttribute("number"),
    to: measures[measures.length - 1].raw.getAttribute("number"),
  }
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
        aMeasureNumbers: null,
        bMeasureNumbers: null,
      };

      digestDiff.aMeasureNumbers = getMeasureNumbers(digestDiff.aMeasures);
      digestDiff.bMeasureNumbers = getMeasureNumbers(digestDiff.bMeasures);

      return digestDiff;
    });
  }
}

class Measure {
  public raw: Element;
  public filtered: Element;

  constructor(raw: Element, filtered: Element) {
    this.raw = raw;
    this.filtered = filtered;
  }

  get musicXML(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
      <score-partwise version="3.1">
        <part-list>
          <score-part id="P1">
            <part-name>Temp</part-name>
          </score-part>
        </part-list>
        <part id="P1">
          ${this.filtered.outerHTML}
        </part>
      </score-partwise>
    `;
  }
}

class Score {
  private document: Document;
  public numberOfMeasures: number;
  public partList: string[];
  public digests: string[];
  public loaded: boolean;
  public measures: Measure[];
  private update: (score: Score) => void;
  private ignores: Ignores;

  constructor(xmlString: string, ignores: Ignores, update: (score: Score)=> void) {
    this.loaded = false;
    this.update = update;
    this.document = new DOMParser().parseFromString(xmlString, "text/xml");
    this.ignores = ignores;

    this.numberOfMeasures = this.document.querySelectorAll("measure").length;
    this.partList = Array.prototype.map.call(
      this.document.querySelectorAll("part-list > score-part > part-name"),
      (el: Element) => el.textContent,
    );
    this.measures = Array.from(
      this.document.querySelectorAll("part#P1 > measure")
    ).map((m) => new Measure(m, this.filterElement(m)));

    this.digests = [];
    this.calculateDigest().then((digests) => {
      this.digests = digests;
      this.loaded = true;
      this.update(this);
    })
  }

  private filterElement(el: Element): Element {
    // measure 自体にマッチするセレクタがヒットするように dummy 要素で囲む
    let filtered = new DOMParser().parseFromString("<dummy>" + el.outerHTML + "</dummy>", "text/xml").firstElementChild;

    for (let selector of this.ignores.elements) {
      filtered.querySelectorAll(selector).forEach((e) => {
        e.remove();
      });
    }

    for (let selectorAndAttributes of this.ignores.attributes) {
      filtered.querySelectorAll(selectorAndAttributes.selector).forEach((e) => {
        for (let attribute of selectorAndAttributes.attributes) {
          e.removeAttribute(attribute);
        }
      });
    }

    return filtered.firstElementChild;
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
        async (m: Measure) => {
          const ab = await subtle.digest("SHA-256", this.stringToBuffer(m.filtered.outerHTML));
          return this.bufferToString(ab);
        }
      ),
    );
  }
}

export default {
  components: {Diff},
  data() {
    return {
      name: "Vue" as String,
      fileContentA: null,
      fileContentB: null,
      scoreA: null,
      scoreB: null,
      diff: null,
      ignores: {
        elements: [
          "sound",
        ],
        attributes: [
          {
            selector: "measure",
            attributes: ["number"],
          },
        ],
      } as Ignores
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
        if (xmlString !== null) score = new Score(xmlString, this.ignores, (score: Score) => this.updateScore(score, identifier));

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
