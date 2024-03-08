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
          <tr v-for="partDiff in scoreDiff.partDiffs" :key="partDiff.name" @click="currentPartName = partDiff.name">
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

<script setup lang="ts">
import Diff from "./Diff.vue";
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Score } from "../classes/Score"
import { ScoreDiff } from "../classes/ScoreDiff"
import { Ignores } from "../interfaces/Ignores"
import { computed, ref, onMounted } from "vue"

library.add(faGithub);

const props = defineProps({
  defaultFilePathA: {type: String},
  defaultFilePathB: {type: String},
});

const partA = computed(() => {
  if (currentPartName.value === null) return null;
  if (scoreA.value === null) return null;

  return scoreA.value.parts.find((part) => part.name === currentPartName.value);
})

const partB = computed(() => {
  if (currentPartName.value === null) return null;
  if (scoreB.value === null) return null;

  return scoreB.value.parts.find((part) => part.name === currentPartName.value);
})

const partDiff = computed(() => {
  if (scoreDiff.value === null) return null;
  if (currentPartName.value === null) return null;

  return scoreDiff.value.getPartDiffByName(currentPartName.value)
})

const fileNameA = ref<string|null>(null)
const fileNameB = ref<string|null>(null)
const scoreA = ref<Score|null>(null)
const scoreB = ref<Score|null>(null)
const scoreDiff = ref<ScoreDiff|null>(null)
const currentPartName = ref<string|null>(null)
const ignores = ref<Ignores>({
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
});
const loading = ref(false)
const onSelectFile = async (e: MouseEvent, identifier: string) => {
  const filePath = await window.ipc.openFile();
  if (filePath === undefined) return;

  return await readFile(identifier, filePath);
}

const updateScore = () => {
  if (scoreA.value && scoreA.value.loaded && scoreB.value && scoreB.value.loaded) {
    scoreDiff.value = new ScoreDiff(scoreA.value as Score, scoreB.value as Score);
    currentPartName.value = null;
  } else {
    scoreDiff.value = null;
    currentPartName.value = null;
  }
  loading.value = false;
}

const readFile = async (identifier: string, filePath: string) => {
  loading.value = true;
  const file = await window.ipc.readFile(filePath);

  let score: (Score|null) = null;
  score = new Score(file.data, ignores.value);
  score.load().then(() => { updateScore() })

  switch(identifier) {
    case "A":
      fileNameA.value = file.name;
      scoreA.value = score;
      break;
    case "B":
      fileNameB.value = file.name;
      scoreB.value = score;
      break;
  }
}

onMounted(async () => {
  if (props.defaultFilePathA) await readFile("A", props.defaultFilePathA);
  if (props.defaultFilePathB) await readFile("B", props.defaultFilePathB);
})
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
