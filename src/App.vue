<template>
  <div>Hello {{ name }}!</div>
</template>


<script lang="ts">
export default {
  data() {
    return {
      name: "Vue" as String,
    };
  },
};
</script>
