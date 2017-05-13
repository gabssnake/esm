const assert = require("assert");

describe("dynamic import", () => {
  const canUseToStringTag = typeof Symbol === "function" &&
    typeof Symbol.toStringTag === "symbol";

  it("should support a standalone import() call", () => {
    let callCount = 0;
    const moduleImport = module.import;

    module.import = function (id) {
      callCount++;
      return moduleImport.call(this, id);
    };

    import("./misc/abc");
    module.import = moduleImport;
    assert.strictEqual(callCount, 1);
  });

  it("should resolve as a namespace import", () => {
    return import("./misc/abc").then((ns) => {
      const nsTag = canUseToStringTag ? "[object Module]" : "[object Object]";
      assert.strictEqual(Object.prototype.toString.call(ns), nsTag);
      assert.deepEqual(ns, { a: "a", b: "b", c: "c" });
    });
  });

  it("should support a variable id", () => {
    const id = "./misc/abc";
    return import(id).then((ns) => {
      assert.deepEqual(ns, { a: "a", b: "b", c: "c" });
    });
  });

  it("should support a template string id", () => {
    const id = "./misc/abc";
    return import(`${id}`).then((ns) => {
      assert.deepEqual(ns, { a: "a", b: "b", c: "c" });
    });
  });

  it("should establish live binding of values", () => {
    return import("./misc/live").then((ns) => {
      ns.reset();
      assert.equal(ns.value, 0);
      ns.add(2);
      assert.equal(ns.value, 2);
    });
  });

  it("should support import() in an assignment", () => {
    const p = import("./misc/abc");
    assert.ok(p instanceof Promise);
  });

  it("should support import() in a function", () => {
    function p() {
      return import("./misc/abc");
    }

    assert.ok(p() instanceof Promise);
  });

  it("should support import() with yield", () => {
    function* p() {
      yield import("./misc/abc");
    }

    assert.ok(p());
  });
});