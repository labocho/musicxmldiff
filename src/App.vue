<template>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
  <nav class="navbar navbar-light bg-light" style="font-size: 1.75rem;">
    <div class="container">
      <span class="navbar-brand mb-0 h1" style="font-weight: lighter; font-size: inherit;">
        musicxmldiff
        <span style="font-size: 1.2rem;">beta</span>
      </span>

      <ul class="navbar-nav ms-auto">
        <li class="nav-item">
          <a href="https://github.com/labocho/musicxmldiff" class="nav-link" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']"></font-awesome-icon>
          </a>
        </li>
      </ul>
      <span></span>
    </div>
  </nav>
  <div class="container mt-4">
    <div class="mb-4">
      <b class="text-danger">This version is "beta". Please see <a href="https://github.com/labocho/musicxmldiff/blob/master/README.md" target="_blank">limitation.</a></b>
    </div>
    <div>
      <h4 class="mb-4">Select MusicXML files to compare</h4>
      <section class="d-flex">
        <div style="width: 50%;">
          <input type="file" @change="changeFile($event, 'A')" />
        </div>
        <div style="width: 50%;">
          <input type="file" @change="changeFile($event, 'B')" />
        </div>
      </section>
    </div>
    <div v-if="scoreDiff" class="mt-4">
      <h4>Select part</h4>
      <table class="table partSelector">
        <tbody>
          <tr v-for="partDiff in scoreDiff.partDiffs" :key="partDiff.name" @click="this.currentPartName = partDiff.name">
            <td style="width: 1px">
              <input type="radio" :value="partDiff.name" v-model="currentPartName" :id="`partSelector-${partDiff.name}`"/>
            </td>
            <td>
              {{partDiff.name}}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="partDiff">
      <section>
        <Diff v-for="d, index in partDiff.digestDiffs" :diff="d" :key="index" />
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import {diff} from "fast-myers-diff";
import Diff from "./Diff.vue";
import {library} from '@fortawesome/fontawesome-svg-core'
import {faGithub} from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faGithub);

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

function last(a) {
  return a[a.length - 1];
}

class ScoreDiff {
  public partDiffs: PartDiff[];

  constructor(a: Score, b: Score) {
    let partNames = Array.from(new Set(a.partNames.concat(b.partNames)));
    this.partDiffs = partNames.map((partName) => {
      let partA = a.parts.find((part) => part.name === partName);
      let partB = b.parts.find((part) => part.name === partName);
      return new PartDiff(partName, partA, partB);
    });
  }

  getPartDiffByName(name: string): PartDiff|null {
    return this.partDiffs.find((partDiff) => partDiff.name === name);
  }
}

class PartDiff {
  public digestDiffs: DigestDiff[]
  public name: string

  constructor(name: string, a: Part|null, b: Part|null) {
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
        aMeasureNumbers: null,
        bMeasureNumbers: null,
      };

      digestDiff.aMeasureNumbers = getMeasureNumbers(digestDiff.aMeasures);
      digestDiff.bMeasureNumbers = getMeasureNumbers(digestDiff.bMeasures);

      return digestDiff;
    });
  }
}

interface Context {
  key: string
  time: string
  clef: string
}

class Measure {
  public raw: Element;
  public filtered: Element;
  public context: Context;

  constructor(raw: Element, filtered: Element, context: Context) {
    this.raw = raw;
    this.filtered = filtered;
    this.context = context;
  }

  contextMusicXML(): string {
    let buf = [];
    if (this.context.key !== null) buf.push(this.context.key);
    if (this.context.time !== null) buf.push(this.context.time);
    if (this.context.clef !== null) buf.push(this.context.clef);

    return buf.join("\n");
  }
}

class Part {
  private element: Element;
  public id: string;
  public name: string;
  public numberOfMeasures: number;
  public digests: string[];
  private ignores: Ignores;
  public measures: Measure[];
  public loaded: boolean;

  constructor(element: Element, id: string, name: string, ignores: Ignores) {
    this.element = element;
    this.id = id;
    this.name = name;
    this.loaded = false;
    this.ignores = ignores;

    this.numberOfMeasures = this.element.querySelectorAll("measure").length;

    let context = {
      key: null,
      time: null,
      clef: null,
    };

    this.measures = Array.from(
      this.element.querySelectorAll("part > measure")
    ).map((m) => {
      let measure = new Measure(m, this.filterElement(m), context);
      context = Object.assign({}, context);

      let key = last(m.querySelectorAll("key"));
      if (key !== undefined) context.key = key.outerHTML;

      let time = last(m.querySelectorAll("time"));
      if (time !== undefined) context.time = time.outerHTML;

      let clef = last(m.querySelectorAll("clef"));
      if (clef !== undefined) context.clef = clef.outerHTML;

      return measure;
    });

    this.digests = [];
  }

  load(): Promise<void> {
    return this.calculateDigest().then((digests) => {
      this.digests = digests;
      this.loaded = true;
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

  private stringToBuffer(s: string) {
    return new Uint16Array(Array.prototype.map.call(s, (c: string) => c.charCodeAt(0))).buffer;
  }

  private bufferToString(ab: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint16Array(ab));
  }
}

class Score {
  private document: Document;
  public partNames: string[];
  public parts: Part[];
  public loaded: boolean;

  constructor(xmlString: string, ignores: Ignores) {
    this.loaded = false;
    this.document = new DOMParser().parseFromString(xmlString, "text/xml");
    this.partNames = Array.prototype.map.call(
      this.document.querySelectorAll("part-list > score-part > part-name"),
      (el: Element) => el.textContent,
    );

    this.parts = Array.from(this.document.querySelectorAll("part")).map((el) => {
      let id = el.getAttribute("id");
      let name = this.document.querySelector(`part-list > score-part#${id} > part-name`).textContent;
      return new Part(el, id, name, ignores)
    });
  }

  load(): Promise<void> {
    return Promise.all(this.parts.map((part) => part.load())).then(() => {
      this.loaded = true;
    });
  }
}

export default {
  components: {Diff, FontAwesomeIcon},
  computed: {
    partA() {
      if (this.currentPartName === null) return null;
      if (this.scoreA === null) return null;

      return this.scoreA.parts.find((part) => part.name === this.currentPartName);
    },
    partB() {
      if (this.currentPartName === null) return null;
      if (this.scoreB === null) return null;

      return this.scoreB.parts.find((part) => part.name === this.currentPartName);
    },
    partDiff() {
      if (this.scoreDiff === null) return null;

      return this.scoreDiff.getPartDiffByName(this.currentPartName)
    }
  },
  data() {
    return {
      name: "Vue" as String,
      scoreA: null,
      scoreB: null,
      scoreDiff: null,
      currentPartName: null,
      ignores: {
        elements: [
          "sound",
          "rehearsal",
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
        if (xmlString !== null) score = new Score(xmlString, this.ignores);
        score.load().then(() => { this.updateScore() })

        this[`score${identifier}`] = score;
      };
    },
    updateScore(score: Score, identifier: string) {
      this[`score${identifier}`] = Object.assign({}, score);
      if (this.scoreA && this.scoreA.loaded && this.scoreB && this.scoreB.loaded) {
        this.scoreDiff = new ScoreDiff(this.scoreA, this.scoreB);
        this.currentPartName = null;
      } else {
        this.scoreDiff = null;
        this.currentPartName = null;
      }
    },
  },
};
</script>

<style scoped>
.partSelector tr:hover {
  cursor: pointer;
}

h4 {
  font-weight: lighter;
}
</style>
