import { describe, expect, it } from "vitest";
import { searchTreks } from "@/lib/trek-search";

describe("Trek search", () => {
  const treks = [{ name: "Kedarkantha" }, { name: "Har Ki Dun" }, { name: "Rupin Pass" }];
  it("finds a trek regardless of capitalization or surrounding spaces", () => {
    expect(searchTreks(treks, "  RUPIN  ")).toEqual([{ name: "Rupin Pass" }]);
  });
  it("keeps every trip when search is empty", () => {
    expect(searchTreks(treks, "")).toHaveLength(3);
  });
  it("does not return unrelated trips", () => {
    expect(searchTreks(treks, "Everest")).toEqual([]);
  });
});
