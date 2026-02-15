import { describe, it, expect } from "bun:test";

import { createSandbox } from "../src/sandbox";

describe("Concurrent Run Policy Isolation", () => {
  describe("Feature control isolation", () => {
    it("should enforce MemberExpression restriction even when another run overlaps", async () => {
      const sb = createSandbox({ env: "es2022" });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const restrictedRun = sb.run(
        "async function a(){ await sleep(20); return obj.secret; } a()",
        {
          globals: { obj: { secret: "TOP" }, sleep },
          features: { mode: "blacklist", disable: ["MemberExpression"] },
        },
      );

      const overlappingRun = sb.run("async function b(){ await sleep(1); return 1; } b()", {
        globals: { sleep },
      });

      // Await the restricted run first since serialized execution means it
      // completes before the overlapping run starts.
      expect(restrictedRun).rejects.toThrow("MemberExpression is not enabled");

      const result2 = await overlappingRun;
      expect(result2).toBe(1);
    });
  });

  describe("Validator isolation", () => {
    it("should not cross-apply validators between overlapping runs", async () => {
      const sb = createSandbox({ env: "es2022" });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      let validatorCalledForRestricted = false;
      const restrictedValidator = () => {
        validatorCalledForRestricted = true;
        return true;
      };

      let validatorCalledForNormal = false;
      const normalValidator = () => {
        validatorCalledForNormal = true;
        return true;
      };

      const restrictedRun = sb.run("async function a(){ await sleep(20); return 1; } a()", {
        globals: { sleep },
        validator: restrictedValidator,
      });

      const normalRun = sb.run("async function b(){ await sleep(1); return 2; } b()", {
        globals: { sleep },
        validator: normalValidator,
      });

      await Promise.all([restrictedRun, normalRun]);

      expect(validatorCalledForRestricted).toBe(true);
      expect(validatorCalledForNormal).toBe(true);
    });
  });
});
