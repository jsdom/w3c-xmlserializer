"use strict";
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const serialize = require("..");

describe("Derived from WPT xml-serialization.xhtml", () => {
  const { document } = (new JSDOM()).window;

  test("Comment: containing --", () => {
    const dt = document.createComment("--");
    assert.equal(serialize(dt), "<!------>");
  });
  test("Comment: starting with -", () => {
    const dt = document.createComment("- x");
    assert.equal(serialize(dt), "<!--- x-->");
  });
  test("Comment: ending with -", () => {
    const dt = document.createComment("x -");
    assert.equal(serialize(dt), "<!--x --->");
  });
  test("Comment: containing -->", () => {
    const dt = document.createComment("-->");
    assert.equal(serialize(dt), "<!---->-->");
  });
  test("DocumentType: empty public and system id", () => {
    const dt = document.implementation.createDocumentType("html", "", "");
    assert.equal(serialize(dt), "<!DOCTYPE html>");
  });
  test("DocumentType: empty system id", () => {
    const dt = document.implementation.createDocumentType("html", "a", "");
    assert.equal(serialize(dt), '<!DOCTYPE html PUBLIC "a">');
  });
  test("DocumentType: empty public id", () => {
    const dt = document.implementation.createDocumentType("html", "", "a");
    assert.equal(serialize(dt), '<!DOCTYPE html SYSTEM "a">');
  });
  test("DocumentType: non-empty public and system id", () => {
    const dt = document.implementation.createDocumentType("html", "a", "b");
    assert.equal(serialize(dt), '<!DOCTYPE html PUBLIC "a" "b">');
  });
  test("DocumentType: 'APOSTROPHE' (U+0027)", () => {
    const dt = document.implementation.createDocumentType("html", "'", "'");
    assert.equal(serialize(dt), '<!DOCTYPE html PUBLIC "\'" "\'">');
  });
  test("DocumentType: 'QUOTATION MARK' (U+0022)", () => {
    const dt = document.implementation.createDocumentType("html", '"', '"');
    assert.equal(serialize(dt), '<!DOCTYPE html PUBLIC """ """>');
  });
  test("DocumentType: 'APOSTROPHE' (U+0027) and 'QUOTATION MARK' (U+0022)", () => {
    const dt = document.implementation.createDocumentType("html", "\"'", "'\"");
    assert.equal(serialize(dt), '<!DOCTYPE html PUBLIC ""\'" "\'"">');
  });
  test("Element: href attributes are not percent-encoded", () => {
    const el = document.createElement("a");
    el.setAttribute(
      "href",
      "\u3042\u3044\u3046 !\"#$%&'()*+,-./0123456789:;<=>?@A" +
      "BCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    );
    assert.equal(
      serialize(el),
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
    assert.equal(
      serialize(el),
      '<a xmlns="http://www.w3.org/1999/xhtml" href="?\u3042\u3044\u3046 !&quot;$%&amp;\'()*+,-./0123456789:;&lt;=&gt;?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"></a>'
    );
  });
  test("ProcessingInstruction: empty data", () => {
    const pi = document.createProcessingInstruction("a", "");
    assert.equal(serialize(pi), "<?a ?>");
  });
  test("ProcessingInstruction: non-empty data", () => {
    const pi = document.createProcessingInstruction("a", "b");
    assert.equal(serialize(pi), "<?a b?>");
  });
  test("ProcessingInstruction: target contains xml", () => {
    const pi = document.createProcessingInstruction("xml", "b");
    assert.equal(serialize(pi), "<?xml b?>");
  });
  test("ProcessingInstruction: target contains a 'COLON' (U+003A)", () => {
    const pi = document.createProcessingInstruction("x:y", "b");
    assert.equal(serialize(pi), "<?x:y b?>");
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
    assert.equal(
      serialize(document),
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
    assert.equal(
      xmlString,
      '<root><another xmlns="urn:foo"><child1 xmlns="">value1</child1></another></root>'
    );
  });

  test("Check if there is no redundant empty namespace declaration.", () => {
    const input =
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>';
    const root = new DOMParser().parseFromString(input, "text/xml")
      .documentElement;

    assert.equal(
      serialize(root),
      '<root xmlns="urn:bar"><outer xmlns=""><inner>value1</inner></outer></root>'
    );
  });

  test("check XMLSerializer.serializeToString escapes attribute values for roundtripping", () => {
    const parser = new DOMParser();
    const root = parser.parseFromString("<root />", "text/xml").documentElement;

    root.setAttribute("attr", "\t");
    assert.equal(serialize(root), '<root attr="&#x9;"/>');

    root.setAttribute("attr", "\n");
    assert.equal(serialize(root), '<root attr="&#xA;"/>');

    root.setAttribute("attr", "\r");
    assert.equal(serialize(root), '<root attr="&#xD;"/>');
  });

  test("Check if unknown prefixes are handled correctly", () => {
    const document = createXMLDoc();
    const root = document.documentElement;
    const element = root.ownerDocument.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "html:br"
    );
    root.appendChild(element);
    assert.equal(
      serialize(root, { requireWellFormed: true }),
      '<root><child1>value1</child1><html:br xmlns:html="http://www.w3.org/1999/xhtml" /></root>'
    );
  });

  test("Check CDATASection nodes are serialized correctly", () => {
    const markup =
      "<xhtml><style><![CDATA[ a > b { color: red; } ]]></style></xhtml>";

    const document = new DOMParser().parseFromString(markup, "application/xml");

    assert.equal(serialize(document), markup);
  });
});

describe("Well-formedness test cases", () => {
  const { DOMParser } = (new JSDOM()).window;
  const parser = new DOMParser();
  const document = parser.parseFromString("<dummy />", "text/xml");

  test("Rejects invalid XML characters in attribute values only when well-formedness is required", () => {
    const element = document.createElementNS(null, "root");
    const invalidValues = [
      "\u0000",
      "\u0001",
      "\u0008",
      "\u000B",
      "\u000C",
      "\u000E",
      "\u001F",
      "\uD800",
      "\uDC00",
      "\uFFFE",
      "\uFFFF",
      "before\u0000after"
    ];

    for (const value of invalidValues) {
      element.setAttribute("value", value);
      assert.throws(
        () => serialize(element, { requireWellFormed: true }),
        new Error("Failed to serialize XML: attribute value is not well-formed."),
        JSON.stringify(value)
      );
      assert.equal(serialize(element), `<root value="${value}"/>`);
    }
  });

  test("Accepts empty attribute values and XML character boundaries", () => {
    const element = document.createElementNS(null, "root");
    for (const value of ["", " ", "\uD7FF", "\uE000", "\uFFFD", "\u{10000}", "\u{1F600}", "\u{10FFFF}"]) {
      element.setAttribute("value", value);
      assert.equal(serialize(element, { requireWellFormed: true }), `<root value="${value}"/>`);
    }
  });

  test("Escapes valid attribute values when well-formedness is required", () => {
    const element = document.createElementNS(null, "root");
    element.setAttribute("value", "\t\n\r text \u{1F600} &\"<>");
    assert.equal(
      serialize(element, { requireWellFormed: true }),
      '<root value="&#x9;&#xA;&#xD; text \u{1F600} &amp;&quot;&lt;&gt;"/>'
    );
  });

  test("Validates generated namespace declaration values", () => {
    const element = document.createElementNS("urn:\u0000", "root");
    assert.throws(
      () => serialize(element, { requireWellFormed: true }),
      new Error("Failed to serialize XML: attribute value is not well-formed.")
    );
    assert.equal(serialize(element), '<root xmlns="urn:\u0000"/>');

    const withAttribute = document.createElementNS(null, "root");
    withAttribute.setAttributeNS("urn:\u0000", "value", "text");
    assert.throws(
      () => serialize(withAttribute, { requireWellFormed: true }),
      new Error("Failed to serialize XML: attribute value is not well-formed.")
    );
    assert.equal(serialize(withAttribute), '<root xmlns:ns1="urn:\u0000" ns1:value="text"/>');
  });

  test("Validates large XML character strings without overflowing the stack", () => {
    const value = "a".repeat(5_000_000);
    const element = document.createElementNS(null, "root");
    element.setAttribute("value", value);
    const cases = [
      [element, `<root value="${value}"/>`],
      [document.createTextNode(value), value],
      [document.createComment(value), `<!--${value}-->`],
      [document.createProcessingInstruction("target", value), `<?target ${value}?>`],
      [document.implementation.createDocumentType("root", "", value), `<!DOCTYPE root SYSTEM "${value}">`]
    ];
    for (const [node, expected] of cases) {
      assert.equal(serialize(node, { requireWellFormed: true }), expected);
    }

    element.setAttribute("value", `${value}\u0000`);
    assert.throws(
      () => serialize(element, { requireWellFormed: true }),
      new Error("Failed to serialize XML: attribute value is not well-formed.")
    );
  });

  // Derived from https://www.w3.org/TR/xml/#NT-Char
  test("Check Characters are in range", () => {
    // Test this does not throw:
    const emojiNode = document.createTextNode("Emoji 🔍");
    serialize(emojiNode, { requireWellFormed: true });

    const expectedError = new Error("Failed to serialize XML: text node data is not well-formed.");

    assert.throws(() => {
      const surrogateBlockNode = document.createTextNode("Surrogate block \uD800");
      serialize(surrogateBlockNode, { requireWellFormed: true });
    }, expectedError);

    assert.throws(() => {
      const fffeNode = document.createTextNode("FFFE \uFFFE");
      serialize(fffeNode, { requireWellFormed: true });
    }, expectedError);

    assert.throws(() => {
      const ffffNode = document.createTextNode("FFFF \uFFFF");
      serialize(ffffNode, { requireWellFormed: true });
    }, expectedError);
  });
});

describe("Our own test cases", () => {
  const { DOMParser } = (new JSDOM()).window;

  function createXMLDoc(input) {
    const parser = new DOMParser();
    return parser.parseFromString(input, "text/xml");
  }

  test("Serializes namespaces named after Object prototype properties", () => {
    const document = createXMLDoc("<root/>");
    for (const namespace of ["constructor", "toString", "__proto__"]) {
      const root = document.createElementNS(namespace, "root");
      root.appendChild(document.createElementNS(namespace, "child"));
      for (const requireWellFormed of [false, true]) {
        assert.equal(
          serialize(root, { requireWellFormed }),
          `<root xmlns="${namespace}"><child/></root>`
        );
      }

      const withAttribute = document.createElementNS(null, "root");
      withAttribute.setAttributeNS(namespace, "value", "text");
      assert.equal(
        serialize(withAttribute, { requireWellFormed: true }),
        `<root xmlns:ns1="${namespace}" ns1:value="text"/>`
      );

      const withDeclaration = createXMLDoc(`<root xmlns:p="${namespace}"><p:child/></root>`);
      assert.equal(
        serialize(withDeclaration, { requireWellFormed: true }),
        `<root xmlns:p="${namespace}"><p:child/></root>`
      );
    }
  });

  test("Distinguishes the null namespace from a namespace named null", () => {
    const document = createXMLDoc("<root/>");
    const root = document.documentElement;
    root.setAttribute("value", "one");
    root.setAttributeNS("null", "value", "two");
    assert.equal(
      serialize(root, { requireWellFormed: true }),
      '<root value="one" xmlns:ns1="null" ns1:value="two"/>'
    );
  });

  test("Does not reuse a namespace named null for unnamespaced elements", () => {
    const document = createXMLDoc('<root xmlns="urn:parent" xmlns:p="null"/>');
    const root = document.documentElement;
    root.appendChild(document.createElementNS(null, "child"));
    assert.equal(
      serialize(root, { requireWellFormed: true }),
      '<root xmlns="urn:parent" xmlns:p="null"><child xmlns=""/></root>'
    );
  });

  test("Handles empty prefix declarations in permissive mode", () => {
    const document = createXMLDoc("<root><child/></root>");
    const root = document.documentElement;
    root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:p", "");
    root.firstChild.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:p", "");
    assert.equal(serialize(root), '<root xmlns:p=""><child/></root>');
    assert.throws(
      () => serialize(root, { requireWellFormed: true }),
      new Error("Namespace prefix declarations cannot be used to undeclare a namespace")
    );
  });

  test("Keeps child namespace declarations out of sibling prefix lists", () => {
    const document = createXMLDoc('<root xmlns:p="urn:test"><first xmlns:q="urn:test"/></root>');
    const root = document.documentElement;
    const second = document.createElementNS("urn:test", "second");
    second.setAttributeNS("urn:test", "value", "text");
    root.appendChild(second);

    for (const requireWellFormed of [false, true]) {
      assert.equal(
        serialize(root, { requireWellFormed }),
        '<root xmlns:p="urn:test"><first xmlns:q="urn:test"/><p:second p:value="text"/></root>'
      );
    }
  });

  test("Check prefix memoization (GH-5)", () => {
    const document = createXMLDoc('<?xml version="1.0" encoding="UTF-8"?><root><child1>value1</child1></root>');
    const root = document.documentElement;
    root.setAttributeNS("https://example.com/", "attribute1", "value");
    root.setAttributeNS("https://example.com/", "attribute2", "value");

    assert.equal(
      serialize(document),
      '<root xmlns:ns1="https://example.com/" ns1:attribute1="value" ns1:attribute2="value"><child1>value1</child1></root>'
    );
  });

  test("Serializes custom prefixes", () => {
    const document = createXMLDoc(`<element xmlns:prefix="https://example.com/" prefix:hasOwnProperty='value'></element>`);

    const els = document.getElementsByTagName("element");

    assert.equal(els.length, 1);
    assert.equal(els[0].attributes.length, 2);
    assert.equal(els[0].attributes[1].prefix, "prefix");
    assert.equal(els[0].getAttribute("prefix:hasOwnProperty"), "value");
    assert.equal(
      serialize(els[0]),
      `<element xmlns:prefix="https://example.com/" prefix:hasOwnProperty="value"/>`
    );
  });

  test("Serializes tab characters", () => {
    const document = createXMLDoc(`<dummy />`);

    const el = document.createElement("el");
    el.appendChild(document.createTextNode("\t"));

    assert.equal(serialize(el, { requireWellFormed: true }), "<el>\t</el>");
  });
});
