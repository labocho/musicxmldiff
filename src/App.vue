<template>
  <div>
    <input type="file" @change="changeFile($event, 'A')" />
    <input type="file" @change="changeFile($event, 'B')" />
    <code>{{fileContentA}}</code>
  </div>
</template>


<script lang="ts">
export default {
  data() {
    return {
      name: "Vue" as String,
      fileContentA: "",
      fileContentB: "",
    };
  },
  methods: {
    changeFile(e, identifier) {
      const reader = new FileReader();
      reader.readAsText(e.currentTarget.files[0]);
      reader.onload = (e2) => {
        this[`fileContent${identifier}`] = e2.target.result;
      };
    }
  },
};
</script>
