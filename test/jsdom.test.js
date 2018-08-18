const { JSDOM } = require("jsdom");

const XMLSerializer = require("../lib/XMLSerializer").interface;

function serialize(node) {
  var serializer = new XMLSerializer();
  return serializer.serializeToString(node);
}

describe("JSDOM imports", () => {
  test("Serializes custom prefixes", function() {
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
});
