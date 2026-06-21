import { describe, expect, it, vi } from "vitest";
import {
  categoryLabel,
  cx,
  formatKg,
  percentOf,
} from "@/lib/utils/format";
import {
  COORDINATE_PRECISION,
  roundCoordinate,
  roundCoordinates,
} from "@/lib/utils/geo";
import { createId } from "@/lib/utils/id";
import { downloadJson } from "@/lib/utils/download";

describe("cx", () => {
  it("joins truthy class names only", () => {
    expect(cx("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatKg", () => {
  it("formats a value with the kg unit", () => {
    expect(formatKg(12.5)).toBe("12.5 kg");
  });
});

describe("categoryLabel", () => {
  it("maps categories to readable labels", () => {
    expect(categoryLabel("home")).toBe("Home Energy");
    expect(categoryLabel("transport")).toBe("Transport");
  });
});

describe("percentOf", () => {
  it("computes a percentage", () => {
    expect(percentOf(25, 100)).toBe(25);
  });
  it("returns 0 when the total is non-positive", () => {
    expect(percentOf(5, 0)).toBe(0);
  });
});

describe("geo rounding", () => {
  it("rounds to the configured precision", () => {
    expect(COORDINATE_PRECISION).toBe(2);
    expect(roundCoordinate(47.612345)).toBe(47.61);
  });
  it("rounds both coordinates", () => {
    expect(roundCoordinates({ lat: 1.23456, lng: -2.98765 })).toEqual({
      lat: 1.23,
      lng: -2.99,
    });
  });
});

describe("createId", () => {
  it("uses crypto.randomUUID when available", () => {
    const id = createId();
    expect(id.length).toBeGreaterThan(0);
  });

  it("falls back when randomUUID is unavailable", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
    expect(createId()).toMatch(/^id-/);
    Object.defineProperty(crypto, "randomUUID", {
      value: original,
      configurable: true,
    });
  });
});

describe("downloadJson", () => {
  it("creates, clicks and revokes an object URL", () => {
    const click = vi.fn();
    const anchor = { href: "", download: "", click } as unknown as HTMLAnchorElement;
    const doc = {
      createElement: vi.fn().mockReturnValue(anchor),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    } as unknown as Document;
    const urlApi = {
      createObjectURL: vi.fn().mockReturnValue("blob:1"),
      revokeObjectURL: vi.fn(),
    };

    downloadJson("data.json", "{}", doc, urlApi);

    expect(anchor.download).toBe("data.json");
    expect(click).toHaveBeenCalledOnce();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:1");
  });
});
