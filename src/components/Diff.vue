<template>
  <div class="measure" ref="root">
    <div class="mb-4 d-flex" style="align-items: center;">
      <h4 style="flex-grow: 1; margin: 0;">{{measureNumber}}</h4>

      <button v-if="!showDiff" class="btn btn-outline-dark mt-2 mb-2" @click="showDiff = true">
        Show diff
      </button>
      <button v-else class="btn btn-outline-dark mt-2 mb-2" @click="showDiff = false">
        Hide diff
      </button>
    </div>
    <div style="display: flex;" v-if="show">
      <SheetMusic v-if="diff.aMeasures[0]" :musicXML="musicXML(diff.aMeasures)" style="width: 50%" />
      <div v-else style="width: 50%" />
      <SheetMusic v-if="diff.bMeasures[0]" :musicXML="musicXML(diff.bMeasures)" style="width: 50%" />
      <div v-else style="width: 50%" />
    </div>
    <div v-if="showDiff">
      <div v-html="udiffToHTML(udiff(diff.aMeasures, diff.bMeasures))"></div>
    </div>
  </div>
</template>


<script setup lang="ts">
import * as diff2html from "diff2html";
import {createTwoFilesPatch} from "diff";
import SheetMusic from "./SheetMusic.vue";
import {Measure} from "../classes/Measure";
import { computed, ref, onMounted, onUnmounted } from "vue"

const props = defineProps({
  diff: {
    type: Object,
    required: true,
  }
});

const measureNumber = computed(() => {
  let n = props.diff.aMeasureNumbers;
  let a = n.from === n.to ? n.from : `${n.from}-${n.to}`;

  n = props.diff.bMeasureNumbers;
  let b = n.from === n.to ? n.from : `${n.from}-${n.to}`;

  return a === b ? `Measure ${a}` : `Measure ${a} : ${b}`;
});


const show = ref(false);
const showDiff = ref(false);
const root = ref<HTMLElement>();

let observer: null|IntersectionObserver = null;

const musicXML = (measures: Measure[]) => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="3.1">
      <part-list>
        <score-part id="P1">
          <part-name>Temp</part-name>
        </score-part>
      </part-list>
      <part id="P1">
        ${measures[0].raw.outerHTML.replace(/(<attributes.*?>)/, "$1" + measures[0].contextMusicXML()) + "\n"}
        ${measures.slice(1).map((m) => m.raw.outerHTML).join("\n")}
      </part>
    </score-partwise>
  `;
}

const udiff = (aMeasures: Measure[], bMeasures: Measure[]) => {
  let a = [];
  let b = [];

  for (let m of aMeasures) {
    a.push(m.filtered.outerHTML)
  }

  for (let m of bMeasures) {
    b.push(m.filtered.outerHTML)
  }

  return createTwoFilesPatch(
    "left",
    "right",
    a.join(""),
    b.join(""),
  );
}

const udiffToHTML = (udiff: string) => {
  return diff2html.html(udiff, {outputFormat: "side-by-side"});
}

onMounted(() => {
  observer = new IntersectionObserver((entries, _observer) => entries.forEach(
    (entry) => {
      if (entry.isIntersecting) show.value = true;
    }
  ))
  observer.observe(root.value!)
})

onUnmounted(() => {
  observer!.disconnect();
})
</script>

<style scoped>
  .measure {
    margin: 1em 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  h4 {
    font-weight: lighter;
  }
</style>
