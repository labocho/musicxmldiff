<template>
  <div class="measure" ref="root">
    <div class="mb-4 d-flex" style="align-items: center;">
      <h4 style="flex-grow: 1; margin: 0;">{{measureNumber}}</h4>

      <button v-if="!showDiff" class="btn btn-outline-dark mt-2 mb-2" @click="this.showDiff = true">
        Show diff
      </button>
      <button v-else class="btn btn-outline-dark mt-2 mb-2" @click="this.showDiff = false">
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


<script lang="ts">
import * as diff2html from "diff2html";
import {createTwoFilesPatch} from "diff";
import SheetMusic from "./SheetMusic.vue";
import {Measure} from "../classes/Measure";

export default {
  components: {SheetMusic},
  computed: {
    measureNumber(): string {
      let n = this.diff.aMeasureNumbers;
      let a = n.from === n.to ? n.from : `${n.from}-${n.to}`;

      n = this.diff.bMeasureNumbers;
      let b = n.from === n.to ? n.from : `${n.from}-${n.to}`;

      return a === b ? `Measure ${a}` : `Measure ${a} : ${b}`;
    }
  },
  data() {
    return {
      show: false,
      showDiff: false,
      observer: null as null|IntersectionObserver,
    }
  },
  methods: {
    musicXML(measures: Measure[]): string {
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
    },
    udiff(aMeasures: Measure[], bMeasures: Measure[]): string {
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
    },
    udiffToHTML(udiff: string) {
      return diff2html.html(udiff, {outputFormat: "side-by-side"});
    },
  },
  mounted() {
    this.observer = new IntersectionObserver((entries, _observer) => entries.forEach(
      (entry) => {
        if (entry.isIntersecting) this.show = true;
      }
    ))
    this.observer.observe(this.$refs.root as Element)
  },
  unmounted() {
    this.observer!.disconnect();
  },
  props: {
    diff: {
      type: Object,
    }
  },
}
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
