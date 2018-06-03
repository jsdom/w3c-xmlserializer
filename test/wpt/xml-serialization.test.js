const { JSDOM } = require("jsdom");

const XMLSerializer = require("../../lib/XMLSerializer").interface;

function serialize(node) {
  var serializer = new XMLSerializer();
  return serializer.serializeToString(node);
}

describe("xml-serialization", () => {
  const document = new JSDOM().window.document;

  test("Comment: containing --", function() {
    var dt = document.createComment("--");
    expect(serialize(dt)).toEqual("<!------>");
  });
  test("Comment: starting with -", function() {
    var dt = document.createComment("- x");
    expect(serialize(dt)).toEqual("<!--- x-->");
  });
  test("Comment: ending with -", function() {
    var dt = document.createComment("x -");
    expect(serialize(dt)).toEqual("<!--x --->");
  });
  test("Comment: containing -->", function() {
    var dt = document.createComment("-->");
    expect(serialize(dt)).toEqual("<!---->-->");
  });
  test("DocumentType: empty public and system id", function() {
    var dt = document.implementation.createDocumentType("html", "", "");
    expect(serialize(dt)).toEqual("<!DOCTYPE html>");
  });
  test("DocumentType: empty system id", function() {
    var dt = document.implementation.createDocumentType("html", "a", "");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC "a">');
  });
  test("DocumentType: empty public id", function() {
    var dt = document.implementation.createDocumentType("html", "", "a");
    expect(serialize(dt)).toEqual('<!DOCTYPE html SYSTEM "a">');
  });
  test("DocumentType: non-empty public and system id", function() {
    var dt = document.implementation.createDocumentType("html", "a", "b");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC "a" "b">');
  });
  test("DocumentType: 'APOSTROPHE' (U+0027)", function() {
    var dt = document.implementation.createDocumentType("html", "'", "'");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC "\'" "\'">');
  });
  test("DocumentType: 'QUOTATION MARK' (U+0022)", function() {
    var dt = document.implementation.createDocumentType("html", '"', '"');
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC """ """>');
  });
  test("DocumentType: 'APOSTROPHE' (U+0027) and 'QUOTATION MARK' (U+0022)", function() {
    var dt = document.implementation.createDocumentType("html", "\"'", "'\"");
    expect(serialize(dt)).toEqual('<!DOCTYPE html PUBLIC ""\'" "\'"">');
  });
  test("Element: href attributes are not percent-encoded", function() {
    var el = document.createElement("a");
    el.setAttribute(
      "href",
      "\u3042\u3044\u3046 !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    );
    expect(serialize(el)).toEqual(
      '<a xmlns="http://www.w3.org/1999/xhtml" href="\u3042\u3044\u3046 !&quot;#$%&amp;\'()*+,-./0123456789:;&lt;=&gt;?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"></a>'
    );
  });
  test("Element: query parts in href attributes are not percent-encoded", function() {
    var el = document.createElement("a");
    el.setAttribute(
      "href",
      "?\u3042\u3044\u3046 !\"$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    );
    expect(serialize(el)).toEqual(
      '<a xmlns="http://www.w3.org/1999/xhtml" href="?\u3042\u3044\u3046 !&quot;$%&amp;\'()*+,-./0123456789:;&lt;=&gt;?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"></a>'
    );
  });
  test("ProcessingInstruction: empty data", function() {
    var pi = document.createProcessingInstruction("a", "");
    expect(serialize(pi)).toEqual("<?a ?>");
  });
  test("ProcessingInstruction: non-empty data", function() {
    var pi = document.createProcessingInstruction("a", "b");
    expect(serialize(pi)).toEqual("<?a b?>");
  });
  test("ProcessingInstruction: target contains xml", function() {
    var pi = document.createProcessingInstruction("xml", "b");
    expect(serialize(pi)).toEqual("<?xml b?>");
  });
  test("ProcessingInstruction: target contains a 'COLON' (U+003A)", function() {
    var pi = document.createProcessingInstruction("x:y", "b");
    expect(serialize(pi)).toEqual("<?x:y b?>");
  });
});
