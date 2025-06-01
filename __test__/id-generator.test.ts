import { generateId } from "../src/utils/id-generator";

describe("ID Generator", () => {
  it("should generate a valid UUID format", () => {
    const id = generateId();
    expect(typeof id).toBe("string");

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });

  it("should generate different IDs each time", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("should generate IDs with correct length", () => {
    const id = generateId();
    expect(id.length).toBe(36); // UUID format length
  });

  it("should generate multiple unique IDs", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100); // All should be unique
  });
});
