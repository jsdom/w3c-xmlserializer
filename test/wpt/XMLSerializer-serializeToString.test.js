const { JSDOM } = require("jsdom");

const XMLSerializer = require("../../lib/XMLSerializer").interface;

describe("WPT", () => {
  const serializer = new XMLSerializer();
  const DOMParser = new JSDOM().window.DOMParser;

  function createXmlDoc() {
    const input =
      '<?xml version="1.0" encoding="UTF-8"?><root><child1>value1</child1></root>';
    const parser = new DOMParser();
    return parser.parseFromString(input, "text/xml");
  }

  test("check XMLSerializer.serializeToString method could parsing xmldoc to string", async () => {
    const document = createXmlDoc();
    expect(serializer.serializeToString(document)).toEqual(
      "<root><child1>value1</child1></root>"
    );
  });

  test("Check if the default namespace is correctly reset.", async () => {
    const document = createXmlDoc();
    var root = document.documentElement;
    var element = root.ownerDocument.createElementNS("urn:foo", "another");
    var child1 = root.firstChild;
    root.replaceChild(element, child1);
    element.appendChild(child1);
    var xmlString = serializer.serializeToString(root);
    expect(xmlString).toEqual(
      '<root><another xmlns="urn:foo"><child1 xmlns="">value1</child1></another></root>'
    );
  });

  test("Check if there is no redundant empty namespace declaration.", async () => {
    const input =
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>';
    const root = new DOMParser().parseFromString(input, "text/xml")
      .documentElement;

    expect(serializer.serializeToString(root)).toEqual(
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>'
    );
  });

  test("check XMLSerializer.serializeToString escapes attribute values for roundtripping", function() {
    var serializer = new XMLSerializer();
    var parser = new DOMParser();
    var root = parser.parseFromString("<root />", "text/xml").documentElement;

    root.setAttribute("attr", "\t");
    expect(['<root attr="&#9;"/>', '<root attr="&#x9;"/>']).toContain(
      serializer.serializeToString(root)
    );

    root.setAttribute("attr", "\n");
    expect(['<root attr="&#xA;"/>', '<root attr="&#10;"/>']).toContain(
      serializer.serializeToString(root)
    );

    root.setAttribute("attr", "\r");
    expect(['<root attr="&#xD;"/>', '<root attr="&#13;"/>']).toContain(
      serializer.serializeToString(root)
    );
  });

  test("check CDATASection nodes are serialized correctly", () => {
    const markup =
      "<xhtml><style><![CDATA[ a > b { color: red; } ]]></style></xhtml>";

    const document = new DOMParser().parseFromString(markup, "application/xml");

    expect(new XMLSerializer().serializeToString(document)).toEqual(markup);
  });
});
