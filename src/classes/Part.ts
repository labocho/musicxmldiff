import { Ignores } from "../interfaces/Ignores";
import { Measure } from "./Measure";

export function last(a) {
  return a[a.length - 1];
}

export class Part {
  private element: Element;
  public id: string;
  public name: string;
  public numberOfMeasures: number;
  public digests: string[];
  private ignores: Ignores;
  public measures: Measure[];
  public loaded: boolean;

  constructor(element: Element, id: string, name: string, ignores: Ignores) {
    this.element = element;
    this.id = id;
    this.name = name;
    this.loaded = false;
    this.ignores = ignores;

    this.numberOfMeasures = this.element.querySelectorAll("measure").length;

    let context = {
      key: null,
      time: null,
      clef: null,
    };

    this.measures = Array.from(
      this.element.querySelectorAll("part > measure")
    ).map((m) => {
      let measure = new Measure(m, this.filterElement(m), context);
      context = Object.assign({}, context);

      let key = last(m.querySelectorAll("key"));
      if (key !== undefined)
        context.key = key.outerHTML;

      let time = last(m.querySelectorAll("time"));
      if (time !== undefined)
        context.time = time.outerHTML;

      let clef = last(m.querySelectorAll("clef"));
      if (clef !== undefined)
        context.clef = clef.outerHTML;

      return measure;
    });

    this.digests = [];
  }

  async load(): Promise<void> {
    const digests = await this.calculateDigest();
    this.digests = digests;
    this.loaded = true;
  }

  private filterElement(el: Element): Element {
    // measure 自体にマッチするセレクタがヒットするように dummy 要素で囲む
    let filtered = new DOMParser().parseFromString("<dummy>" + el.outerHTML + "</dummy>", "text/xml").firstElementChild;

    for (let selector of this.ignores.elements) {
      filtered.querySelectorAll(selector).forEach((e) => {
        e.remove();
      });
    }

    for (let selectorAndAttributes of this.ignores.attributes) {
      filtered.querySelectorAll(selectorAndAttributes.selector).forEach((e) => {
        for (let attribute of selectorAndAttributes.attributes) {
          e.removeAttribute(attribute);
        }
      });
    }

    return filtered.firstElementChild;
  }

  private async calculateDigest(): Promise<string[]> {
    const subtle = window.crypto.subtle;
    return await Promise.all(
      Array.prototype.map.call(
        this.measures,
        async (m: Measure) => {
          const ab = await subtle.digest("SHA-256", this.stringToBuffer(m.filtered.outerHTML));
          return this.bufferToString(ab);
        }
      )
    );
  }

  private stringToBuffer(s: string) {
    return new Uint16Array(Array.prototype.map.call(s, (c: string) => c.charCodeAt(0))).buffer;
  }

  private bufferToString(ab: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint16Array(ab));
  }
}
