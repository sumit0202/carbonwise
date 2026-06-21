import { describe, expect, it } from "vitest";
import {
  fieldErrors,
  manualActivitySchema,
  profileSchema,
} from "@/lib/validation/profile";

const validProfile = {
  householdSize: 2,
  diet: "omnivore",
  commuteMode: "car",
  weeklyTravelKm: 100,
  electricityKwhPerMonth: 300,
  shoppingLevel: "average",
  recycling: "some",
  goal: "overall",
};

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("treats empty city as undefined", () => {
    const result = profileSchema.parse({ ...validProfile, city: "   " });
    expect(result.city).toBeUndefined();
  });

  it("keeps a provided city", () => {
    const result = profileSchema.parse({ ...validProfile, city: "Seattle" });
    expect(result.city).toBe("Seattle");
  });

  it("rejects a household size below 1", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, householdSize: 0 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer household size", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, householdSize: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects travel over the maximum", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, weeklyTravelKm: 99999 }).success,
    ).toBe(false);
  });

  it("rejects negative electricity", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, electricityKwhPerMonth: -1 })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid enum value", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, diet: "carnivore" }).success,
    ).toBe(false);
  });

  it("accepts optional rounded coordinates", () => {
    const result = profileSchema.parse({
      ...validProfile,
      coordinates: { lat: 47.61, lng: -122.33 },
    });
    expect(result.coordinates?.lat).toBe(47.61);
  });

  it("rejects out-of-range coordinates", () => {
    expect(
      profileSchema.safeParse({
        ...validProfile,
        coordinates: { lat: 200, lng: 0 },
      }).success,
    ).toBe(false);
  });
});

describe("manualActivitySchema", () => {
  it("accepts a valid activity", () => {
    expect(
      manualActivitySchema.safeParse({
        id: "abc",
        category: "transport",
        label: "Flight",
        weeklyKgCo2e: 10,
      }).success,
    ).toBe(true);
  });

  it("rejects an empty label", () => {
    expect(
      manualActivitySchema.safeParse({
        id: "abc",
        category: "transport",
        label: "",
        weeklyKgCo2e: 10,
      }).success,
    ).toBe(false);
  });

  it("rejects an emission estimate over the cap", () => {
    expect(
      manualActivitySchema.safeParse({
        id: "abc",
        category: "transport",
        label: "x",
        weeklyKgCo2e: 99999,
      }).success,
    ).toBe(false);
  });
});

describe("fieldErrors", () => {
  it("flattens issues into a field map and keeps the first per field", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      householdSize: 0,
      weeklyTravelKm: -5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.householdSize).toBeDefined();
      expect(errors.weeklyTravelKm).toBeDefined();
    }
  });

  it("uses 'form' for top-level issues", () => {
    const result = profileSchema.safeParse("not an object");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).form).toBeDefined();
    }
  });
});
