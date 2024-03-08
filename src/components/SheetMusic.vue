<template>
  <div ref="sheetmusic" />
</template>

<script setup lang="ts">
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  musicXML: {type: String, required: true},
});

const renderSheetMusic = () => {
  let osmd = new OpenSheetMusicDisplay(sheetmusic.value!, {drawTitle: false, drawPartNames: false});
  osmd.load(props.musicXML).then(() => osmd.render());
}

const sheetmusic = ref<HTMLElement>()

onMounted(() => {
  renderSheetMusic();
});

watch(() => props.musicXML, () =>{
  renderSheetMusic();
});
</script>
