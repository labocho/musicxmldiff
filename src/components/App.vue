<template>
  <div class="loading-indicator" v-if="loading"></div>
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
          <button type="button" class="btn btn-primary" @click="onSelectFile($event, 'A')">{{ fileNameA || "ファイルを選択" }}</button>
        </div>
        <div style="width: 50%;">
          <button type="button" class="btn btn-primary" @click="onSelectFile($event, 'B')">{{ fileNameB || "ファイルを選択" }}</button>
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
import Diff from "./Diff.vue";
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Score } from "../classes/Score"
import { ScoreDiff } from "../classes/ScoreDiff"
import { Ignores } from "../interface/Ignores"

library.add(faGithub);

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
      fileNameA: null,
      fileNameB: null,
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
      } as Ignores,
      loading: false,
    };
  },
  filters: {
  },
  methods: {
    async onSelectFile(e: InputEvent, identifier: string) {
      const filePath = await window.ipc.openFile();
      if (filePath === undefined) return;

      return await this.readFile(identifier, filePath);
    },
    updateScore() {
      if (this.scoreA && this.scoreA.loaded && this.scoreB && this.scoreB.loaded) {
        this.scoreDiff = new ScoreDiff(this.scoreA, this.scoreB);
        this.currentPartName = null;
      } else {
        this.scoreDiff = null;
        this.currentPartName = null;
      }
      this.loading = false;
    },
    async readFile(identifier: string, filePath: string) {
      this.loading = true;
      const file = await window.ipc.readFile(filePath);

      let score: (Score|null) = null;
      score = new Score(file.data, this.ignores);
      score.load().then(() => { this.updateScore() })

      this[`fileName${identifier}`] = file.name;
      this[`score${identifier}`] = score;
    }
  },
  async mounted() {
    if (this.defaultFilePathA !== null) await this.readFile("A", this.defaultFilePathA);
    if (this.defaultFilePathB !== null) await this.readFile("B", this.defaultFilePathB);
  },
  props: {
    defaultFilePathA: null as PropType<string|null>,
    defaultFilePathB: null as PropType<string|null>,
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

.loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  z-index: 1000;
}
</style>
