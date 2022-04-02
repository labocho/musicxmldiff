<template>
  <div ref="sheetmusic" />
</template>

<script lang="ts">

import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default {
  mounted() {
    this.osmd = new OpenSheetMusicDisplay(this.$refs.sheetmusic, {drawTitle: false, drawPartNames: false});
    this.osmd.load(this.musicXML).then(() => this.osmd.render());
  },
  props: {
    musicXML: {
      type: String,
    }
  },
}
</script>
