<template>
  <div>
    <input type="file" @change="changeFile($event, 'A')" />
    <input type="file" @change="changeFile($event, 'B')" />
    <div v-if="scoreA">
      <code>{{scoreA.numberOfMeasures}}</code>
      <ul>
        <li v-for="part in scoreA.partList" :key="part">{{part}}</li>
      </ul>
    </div>
    <div v-if="scoreB">
      <code>{{scoreB.numberOfMeasures}}</code>
      <ul>
        <li v-for="part in scoreB.partList" :key="part">{{part}}</li>
      </ul>
    </div>

  </div>
</template>

<script lang="ts">

class Score {
  private document: Document;
  private _numberOfMeasures: number;
  private _partList: string[];

  constructor(xmlString: string) {
    this.document = new DOMParser().parseFromString(xmlString, "text/xml");
    this._numberOfMeasures = this.document.querySelectorAll("measure").length;
    this._partList = Array.prototype.map.call(
      this.document.querySelectorAll("part-list > score-part > part-name"),
      (el: Element) => el.textContent,
    );
  }

  get numberOfMeasures(): number {
    return this._numberOfMeasures;
  }

  get partList(): string[] {
    return this._partList;
  }
}

export default {
  computed: {
    scoreA() {
      if (this.fileContentA === null) return null;
      return new Score(this.fileContentA);
    },
    scoreB() {
      if (this.fileContentB === null) return null;
      return new Score(this.fileContentB);
    },
  },
  data() {
    return {
      name: "Vue" as String,
      fileContentA: null,
      fileContentB: null,
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
