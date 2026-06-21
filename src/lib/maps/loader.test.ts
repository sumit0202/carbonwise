import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetMapsLoader,
  loadGoogleMaps,
  type LoaderDocument,
  type MapsScriptElement,
} from "@/lib/maps/loader";

beforeEach(() => _resetMapsLoader());

function fakeDoc() {
  let created: MapsScriptElement | null = null;
  const doc: LoaderDocument = {
    getElementById: () => null,
    createElement: () => {
      created = {
        id: "",
        src: "",
        async: false,
        onload: null,
        onerror: null,
      };
      return created;
    },
    head: { appendChild: () => undefined },
  };
  return { doc, getScript: () => created };
}

describe("loadGoogleMaps", () => {
  it("resolves immediately when maps is already present", async () => {
    const win = { google: { maps: { ready: true } } };
    await expect(loadGoogleMaps("k", win, fakeDoc().doc)).resolves.toEqual({
      ready: true,
    });
  });

  it("injects a script and resolves on load", async () => {
    const win: { google?: { maps?: unknown } } = {};
    const { doc, getScript } = fakeDoc();
    const promise = loadGoogleMaps("my-key", win, doc);
    const script = getScript()!;
    expect(script.src).toContain("maps.googleapis.com");
    expect(script.src).toContain("my-key");
    win.google = { maps: { loaded: true } };
    script.onload!();
    await expect(promise).resolves.toEqual({ loaded: true });
  });

  it("rejects when the script loads without google.maps", async () => {
    const win: { google?: { maps?: unknown } } = {};
    const { doc, getScript } = fakeDoc();
    const promise = loadGoogleMaps("k", win, doc);
    getScript()!.onload!();
    await expect(promise).rejects.toThrow(/without google.maps/);
  });

  it("rejects on script error", async () => {
    const win: { google?: { maps?: unknown } } = {};
    const { doc, getScript } = fakeDoc();
    const promise = loadGoogleMaps("k", win, doc);
    getScript()!.onerror!();
    await expect(promise).rejects.toThrow(/Failed to load/);
  });

  it("memoizes a pending load", () => {
    const win: { google?: { maps?: unknown } } = {};
    const { doc } = fakeDoc();
    const first = loadGoogleMaps("k", win, doc);
    const second = loadGoogleMaps("k", win, doc);
    expect(first).toBe(second);
  });
});
