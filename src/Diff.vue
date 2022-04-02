<template>
  <li>
    <h4>A[{{diff.aMeasureNumbers.from}}..{{diff.aMeasureNumbers.to}}] is different from B[{{diff.bMeasureNumbers.from}}..{{diff.bMeasureNumbers.to}}]</h4>
    <div v-html="udiffToHTML(udiff(diff.aMeasures, diff.bMeasures))"></div>
    <div style="display: flex;">
      <SheetMusic v-if="diff.aMeasures[0]" :musicXML="diff.aMeasures[0].musicXML" style="width: 50%" />
      <div v-else style="width: 50%" />
      <SheetMusic v-if="diff.bMeasures[0]" :musicXML="diff.bMeasures[0].musicXML" style="width: 50%" />
      <div v-else style="width: 50%" />
    </div>
  </li>
</template>


<script lang="ts">
import * as diff2html from "diff2html";
import {createTwoFilesPatch} from "diff";
import SheetMusic from "./SheetMusic.vue";

export default {
  components: {SheetMusic},
  methods: {
    udiff(aMeasures, bMeasures) {
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
    udiffToHTML(udiff) {
      return diff2html.html(udiff, {outputFormat: "side-by-side"});
    },
  },
  props: {
    diff: {
      type: Object,
    }
  },
}
</script>
