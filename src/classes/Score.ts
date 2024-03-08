import { Part } from "./Part";
import { Ignores } from "../interfaces/Ignores";

export class Score {
  private document: Document;
  public partNames: string[];
  public parts: Part[];
  public loaded: boolean;

  constructor(xmlString: string, ignores: Ignores) {
    this.loaded = false;
    this.document = new DOMParser().parseFromString(xmlString, "text/xml");
    this.partNames = Array.prototype.map.call(
      this.document.querySelectorAll("part-list > score-part > part-name"),
      (el: Element) => el.textContent
    ) as string[];

    this.parts = Array.from(this.document.querySelectorAll("part")).map((el) => {
      let id = el.getAttribute("id")!;
      let name = this.document.querySelector(`part-list > score-part#${id} > part-name`)!.textContent!;
      return new Part(el, id, name, ignores);
    });
  }

  async load(): Promise<void> {
    await Promise.all(this.parts.map((part) => part.load()));
    this.loaded = true;
  }
}
