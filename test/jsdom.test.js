const { JSDOM } = require("jsdom");

const XMLSerializer = require("../lib/XMLSerializer").interface;
const { produceXMLSerialization } = require("../lib/serialization");

function serialize(node) {
  var serializer = new XMLSerializer();
  return serializer.serializeToString(node);
}

function wellFormedSerialize(node) {
  return produceXMLSerialization(node, true);
}

describe("JSDOM imports", () => {
  test("Serializes custom prefixes", () => {
    const {
      window: { document }
    } = new JSDOM(
      `<element xmlns:prefix="https://example.com/" prefix:hasOwnProperty='value'></element>`,
      { contentType: "text/xml" }
    );

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
    const {
      window: { document }
    } = new JSDOM(
      `<dummy />`,
      { contentType: "text/xml" }
    );

    const el = document.createElement("el");
    el.appendChild(document.createTextNode("\t"));

    expect(wellFormedSerialize(el)).toEqual("<el>\t</el>");
  });
});
