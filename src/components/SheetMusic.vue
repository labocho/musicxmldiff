<template>
  <div ref="sheetmusic" />
</template>

<script lang="ts">

import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default {
  methods: {
    renderSheetMusic() {
      let osmd = new OpenSheetMusicDisplay(this.$refs.sheetmusic, {drawTitle: false, drawPartNames: false});
      osmd.load(this.musicXML).then(() => osmd.render());
    }
  },
  mounted() {
    this.renderSheetMusic();
  },
  props: {
    musicXML: {
      type: String,
    }
  },
  watch: {
    musicXML() {
      this.renderSheetMusic();
    }
  }
}
</script>
