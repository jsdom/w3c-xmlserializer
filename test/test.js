"use strict";
const { JSDOM } = require("jsdom");
const serialize = require("..");

describe("Derived from WPT xml-serialization.xhtml", () => {
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

describe("Derived from WPT XMLSerializer-serializeToString.html", () => {
  const { DOMParser } = (new JSDOM()).window;

  function createXMLDoc() {
    const input =
      '<?xml version="1.0" encoding="UTF-8"?><root><child1>value1</child1></root>';
    const parser = new DOMParser();
    return parser.parseFromString(input, "text/xml");
  }

  test("check XMLSerializer.serializeToString method could parsing xmldoc to string", () => {
    const document = createXMLDoc();
    expect(serialize(document)).toEqual(
      "<root><child1>value1</child1></root>"
    );
  });

  test("Check if the default namespace is correctly reset.", () => {
    const document = createXMLDoc();
    const root = document.documentElement;
    const element = root.ownerDocument.createElementNS("urn:foo", "another");
    const child1 = root.firstChild;
    root.replaceChild(element, child1);
    element.appendChild(child1);
    const xmlString = serialize(root);
    expect(xmlString).toEqual(
      '<root><another xmlns="urn:foo"><child1 xmlns="">value1</child1></another></root>'
    );
  });

  test("Check if there is no redundant empty namespace declaration.", () => {
    const input =
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>';
    const root = new DOMParser().parseFromString(input, "text/xml")
      .documentElement;

    expect(serialize(root)).toEqual(
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>'
    );
  });

  test("check XMLSerializer.serializeToString escapes attribute values for roundtripping", () => {
    const parser = new DOMParser();
    const root = parser.parseFromString("<root />", "text/xml").documentElement;

    root.setAttribute("attr", "\t");
    expect(['<root attr="&#9;"/>', '<root attr="&#x9;"/>']).toContain(serialize(root));

    root.setAttribute("attr", "\n");
    expect(['<root attr="&#xA;"/>', '<root attr="&#10;"/>']).toContain(serialize(root));

    root.setAttribute("attr", "\r");
    expect(['<root attr="&#xD;"/>', '<root attr="&#13;"/>']).toContain(serialize(root));
  });

  test("Check if unknown prefixes are handled correctly", () => {
    const document = createXMLDoc();
    const root = document.documentElement;
    const element = root.ownerDocument.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "html:br"
    );
    root.appendChild(element);
    expect(serialize(root, { requireWellFormed: true })).toEqual(
      '<root><child1>value1</child1><html:br xmlns:html="http://www.w3.org/1999/xhtml" /></root>'
    );
  });

  test("Check CDATASection nodes are serialized correctly", () => {
    const markup =
      "<xhtml><style><![CDATA[ a > b { color: red; } ]]></style></xhtml>";

    const document = new DOMParser().parseFromString(markup, "application/xml");

    expect(serialize(document)).toEqual(markup);
  });
});

describe("Our own test cases", () => {
  const { DOMParser } = (new JSDOM()).window;

  function createXMLDoc(input) {
    const parser = new DOMParser();
    return parser.parseFromString(input, "text/xml");
  }

  test("Check prefix memoization (GH-5)", () => {
    const document = createXMLDoc('<?xml version="1.0" encoding="UTF-8"?><root><child1>value1</child1></root>');
    const root = document.documentElement;
    root.setAttributeNS("https://example.com/", "attribute1", "value");
    root.setAttributeNS("https://example.com/", "attribute2", "value");

    expect(serialize(document)).toEqual(
      '<root xmlns:ns1="https://example.com/" ns1:attribute1="value" ns1:attribute2="value"><child1>value1</child1></root>'
    );
  });

  test("Serializes custom prefixes", () => {
    const document = createXMLDoc(`<element xmlns:prefix="https://example.com/" prefix:hasOwnProperty='value'></element>`);

    const els = document.getElementsByTagName("element");

    expect(els).toHaveLength(1);
    expect(els[0].attributes).toHaveLength(2);
    expect(els[0].attributes[1].prefix).toEqual("prefix");
    expect(els[0].getAttribute("prefix:hasOwnProperty")).toEqual("value");
    expect(serialize(els[0])).toEqual(
      `<element xmlns:prefix="https://example.com/" prefix:hasOwnProperty="value"/>`
    );
  });

  test("Serializes tab characters", () => {
    const document = createXMLDoc(`<dummy />`);

    const el = document.createElement("el");
    el.appendChild(document.createTextNode("\t"));

    expect(serialize(el, { requireWellFormed: true })).toEqual("<el>\t</el>");
  });
});
