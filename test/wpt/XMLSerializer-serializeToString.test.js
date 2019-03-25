"use strict";
const { JSDOM } = require("jsdom");

const XMLSerializer = require("../..").XMLSerializer.interface;

describe("WPT", () => {
  const serializer = new XMLSerializer();
  const { DOMParser } = (new JSDOM()).window;

  function createXmlDoc() {
    const input =
      '<?xml version="1.0" encoding="UTF-8"?><root><child1>value1</child1></root>';
    const parser = new DOMParser();
    return parser.parseFromString(input, "text/xml");
  }

  test("check XMLSerializer.serializeToString method could parsing xmldoc to string", () => {
    const document = createXmlDoc();
    expect(serializer.serializeToString(document)).toEqual(
      "<root><child1>value1</child1></root>"
    );
  });

  test("Check if the default namespace is correctly reset.", () => {
    const document = createXmlDoc();
    const root = document.documentElement;
    const element = root.ownerDocument.createElementNS("urn:foo", "another");
    const child1 = root.firstChild;
    root.replaceChild(element, child1);
    element.appendChild(child1);
    const xmlString = serializer.serializeToString(root);
    expect(xmlString).toEqual(
      '<root><another xmlns="urn:foo"><child1 xmlns="">value1</child1></another></root>'
    );
  });

  test("Check if there is no redundant empty namespace declaration.", () => {
    const input =
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>';
    const root = new DOMParser().parseFromString(input, "text/xml")
      .documentElement;

    expect(serializer.serializeToString(root)).toEqual(
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>'
    );
  });

  test("check XMLSerializer.serializeToString escapes attribute values for roundtripping", () => {
    const parser = new DOMParser();
    const root = parser.parseFromString("<root />", "text/xml").documentElement;

    root.setAttribute("attr", "\t");
    expect(['<root attr="&#9;"/>', '<root attr="&#x9;"/>']).toContain(serializer.serializeToString(root));

    root.setAttribute("attr", "\n");
    expect(['<root attr="&#xA;"/>', '<root attr="&#10;"/>']).toContain(serializer.serializeToString(root));

    root.setAttribute("attr", "\r");
    expect(['<root attr="&#xD;"/>', '<root attr="&#13;"/>']).toContain(serializer.serializeToString(root));
  });

  test("Check if unknown prefixes are handled correctly", () => {
    const document = createXmlDoc();
    const root = document.documentElement;
    const element = root.ownerDocument.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "html:br"
    );
    root.appendChild(element);
    expect(serializer.serializeToString(root, true)).toEqual(
      '<root><child1>value1</child1><html:br xmlns:html="http://www.w3.org/1999/xhtml" /></root>'
    );
  });

  test("Check CDATASection nodes are serialized correctly", () => {
    const markup =
      "<xhtml><style><![CDATA[ a > b { color: red; } ]]></style></xhtml>";

    const document = new DOMParser().parseFromString(markup, "application/xml");

    expect(serializer.serializeToString(document)).toEqual(markup);
  });

  test("Check prefix memoization (GH-5)", () => {
    const document = createXmlDoc();
    const root = document.documentElement;
    root.setAttributeNS("https://example.com/", "attribute1", "value");
    root.setAttributeNS("https://example.com/", "attribute2", "value");

    expect(serializer.serializeToString(document)).toEqual(
      '<root xmlns:ns1="https://example.com/" ns1:attribute1="value" ns1:attribute2="value"><child1>value1</child1></root>'
    );
  });
});
