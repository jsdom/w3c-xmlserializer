"use strict";
const { JSDOM } = require("jsdom");

const XMLSerializer = require("../..").XMLSerializer.interface;

function serialize(node) {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(node);
}

describe("xml-serialization", () => {
  const { document } = (new JSDOM()).window;

  test("Comment: containing --", () => {
    const dt = document.createComment("--");
    expect(serialize(dt)).toEqual("<!------>");
  });
  test("Comment: starting with -", () => {
    const dt = document.createComment("- x");
    expect(serialize(dt)).toEqual("<!--- x-->");
  });
  test("Comment: ending with -", () => {
    const dt = document.createComment("x -");
    expect(serialize(dt)).toEqual("<!--x --->");
  });
  test("Comment: containing -->", () => {
    const dt = document.createComment("-->");
    expect(serialize(dt)).toEqual("<!---->-->");
  });
  test("DocumentType: empty public and system id", () => {
    const dt = document.implementation.createDocumentType("html", "", "");
    expect(serialize(dt)).toEqual("<!DOCTYPE html>");
  });
  test("DocumentType: empty system id", () => {
    const dt = document.implementation.createDocumentType("html", "a", "");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC "a">');
  });
  test("DocumentType: empty public id", () => {
    const dt = document.implementation.createDocumentType("html", "", "a");
    expect(serialize(dt)).toEqual('<!DOCTYPE html SYSTEM "a">');
  });
  test("DocumentType: non-empty public and system id", () => {
    const dt = document.implementation.createDocumentType("html", "a", "b");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC "a" "b">');
  });
  test("DocumentType: 'APOSTROPHE' (U+0027)", () => {
    const dt = document.implementation.createDocumentType("html", "'", "'");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC "\'" "\'">');
  });
  test("DocumentType: 'QUOTATION MARK' (U+0022)", () => {
    const dt = document.implementation.createDocumentType("html", '"', '"');
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC """ """>');
  });
  test("DocumentType: 'APOSTROPHE' (U+0027) and 'QUOTATION MARK' (U+0022)", () => {
    const dt = document.implementation.createDocumentType("html", "\"'", "'\"");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC ""\'" "\'"">');
  });
  test("Element: href attributes are not percent-encoded", () => {
    const el = document.createElement("a");
    el.setAttribute(
      "href",
      "\u3042\u3044\u3046 !\"#$%&'()*+,-./0123456789:;<=>?@A" +
      "BCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    );
    expect(serialize(el)).toEqual(
      '<a xmlns="http://www.w3.org/1999/xhtml" href="\u3042\u3044\u3046 !&quot;#$%&amp;\'()*+,-./0123456789:;&lt;=&gt;?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"></a>'
    );
  });
  test("Element: query parts in href attributes are not percent-encoded", () => {
    const el = document.createElement("a");
    el.setAttribute(
      "href",
      "?\u3042\u3044\u3046 !\"$%&'()*+,-./0123456789:;<=>?@" +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    );
    expect(serialize(el)).toEqual(
      '<a xmlns="http://www.w3.org/1999/xhtml" href="?\u3042\u3044\u3046 !&quot;$%&amp;\'()*+,-./0123456789:;&lt;=&gt;?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"></a>'
    );
  });
  test("ProcessingInstruction: empty data", () => {
    const pi = document.createProcessingInstruction("a", "");
    expect(serialize(pi)).toEqual("<?a ?>");
  });
  test("ProcessingInstruction: non-empty data", () => {
    const pi = document.createProcessingInstruction("a", "b");
    expect(serialize(pi)).toEqual("<?a b?>");
  });
  test("ProcessingInstruction: target contains xml", () => {
    const pi = document.createProcessingInstruction("xml", "b");
    expect(serialize(pi)).toEqual("<?xml b?>");
  });
  test("ProcessingInstruction: target contains a 'COLON' (U+003A)", () => {
    const pi = document.createProcessingInstruction("x:y", "b");
    expect(serialize(pi)).toEqual("<?x:y b?>");
  });
});
