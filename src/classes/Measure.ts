import { Context } from "../interfaces/Context";

export class Measure {
  public raw: Element;
  public filtered: Element;
  public context: Context;

  constructor(raw: Element, filtered: Element, context: Context) {
    this.raw = raw;
    this.filtered = filtered;
    this.context = context;
  }

  contextMusicXML(): string {
    let buf = [];
    if (this.context.key !== null)
      buf.push(this.context.key);
    if (this.context.time !== null)
      buf.push(this.context.time);
    if (this.context.clef !== null)
      buf.push(this.context.clef);

    return buf.join("\n");
  }
}
