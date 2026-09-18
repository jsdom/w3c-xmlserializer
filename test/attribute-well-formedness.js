"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const serialize = require("..");

test("strict serialization rejects invalid XML characters in attribute values", () => {
  const { window } = new JSDOM();
  try {
    const element = window.document.createElementNS("urn:test", "root");
    for (const value of ["\u0000", "\u0001", "\uD800", "\uDC00", "\uFFFE", "\uFFFF"]) {
      element.setAttribute("value", value);
      assert.throws(() => serialize(element, { requireWellFormed: true }));
      assert.doesNotThrow(() => serialize(element));
    }
    element.setAttribute("value", "\t\n\r text \u{1F600} &");
    assert.doesNotThrow(() => serialize(element, { requireWellFormed: true }));
    assert.match(serialize(element, { requireWellFormed: true }), /\u{1F600} &amp;/u);
  } finally {
    window.close();
  }
});

test("namespace names can coincide with Object prototype property names", () => {
  const { window } = new JSDOM();
  try {
    for (const namespace of ["constructor", "toString", "__proto__"]) {
      const element = window.document.createElementNS(namespace, "root");
      element.appendChild(window.document.createElementNS(namespace, "child"));
      assert.equal(
        serialize(element, { requireWellFormed: true }),
        `<root xmlns="${namespace}"><child/></root>`
      );
    }
  } finally {
    window.close();
  }
});
