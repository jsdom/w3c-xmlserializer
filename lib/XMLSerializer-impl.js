"use strict";

const DOMException = require("domexception");
const xnv = require("xml-name-validator");

const attributeUtils = require("./attributes");
const { NAMESPACES, VOID_ELEMENTS, NODE_TYPES } = require("./constants");

function asciiCaseInsensitiveMatch(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; ++i) {
    if ((a.charCodeAt(i) | 32) !== (b.charCodeAt(i) | 32)) {
      return false;
    }
  }

  return true;
}

function recordNamespaceInformation(element, map, prefixMap) {
  let defaultNamespaceAttrValue = null;
  for (const attr of element.attributes) {
    if (attr.namespaceURI === NAMESPACES.XMLNS) {
      if (attr.prefix === null) {
        defaultNamespaceAttrValue = attr.value;
        continue;
      }
      let namespaceDefinition = attr.value;
      if (namespaceDefinition === NAMESPACES.XML) {
        continue;
      }
      // This is exactly the other way than the spec says, but that's intended.
      // All the maps coalesce null to the empty string (explained in the
      // spec), so instead of doing that every time, just do it once here.
      if (namespaceDefinition === null) {
        namespaceDefinition = "";
      }

      if (
        namespaceDefinition in map &&
        map[namespaceDefinition].includes(attr.localName)
      ) {
        continue;
      }
      if (!(namespaceDefinition in map)) {
        map[namespaceDefinition] = [];
      }
      map[namespaceDefinition].push(attr.localName);
      prefixMap[attr.localName] = namespaceDefinition;
    }
  }
  return defaultNamespaceAttrValue;
}

/**
 * @param {{prefixIndex: number}} refs
 */
function xmlSerialization(node, namespace, prefixMap, requireWellFormed, refs) {
  switch (node.nodeType) {
    case NODE_TYPES.DOCUMENT_TYPE_NODE: {
      //TODO: Check PubidChar && Char production
      if (
        requireWellFormed &&
        node.systemId.includes('"') &&
        node.systemId.includes("'")
      ) {
        throw new Error("Node systemId is not well formed");
      }
      let markup = `<!DOCTYPE ${node.name}`;
      if (node.publicId !== "") {
        markup += ` PUBLIC "${node.publicId}"`;
      } else if (node.systemId !== "") {
        markup += " SYSTEM";
      }
      if (node.systemId !== "") {
        markup += ` "${node.systemId}"`;
      }
      return markup + ">";
    }
    case NODE_TYPES.PROCESSING_INSTRUCTION_NODE:
      if (
        requireWellFormed &&
        (node.target.includes(":") ||
          asciiCaseInsensitiveMatch(node.target, "xml"))
      ) {
        throw new Error("Node target is not well formed");
      }
      //TODO: Check XML Char production
      if (requireWellFormed && node.data.includes("?>")) {
        throw new Error("Node data is not well formed");
      }
      return `<?${node.target} ${node.data}?>`;
    case NODE_TYPES.DOCUMENT_NODE: {
      if (requireWellFormed && node.documentElement === null) {
        throw new Error("Document does not have a document element");
      }
      let serializedDocument = "";
      for (const child of node.children) {
        serializedDocument += xmlSerialization(
          child,
          namespace,
          prefixMap,
          requireWellFormed,
          refs
        );
      }
      return serializedDocument;
    }
    case NODE_TYPES.DOCUMENT_FRAGMENT_NODE: {
      let markup = "";
      for (const child of node.children) {
        markup += xmlSerialization(
          child,
          namespace,
          prefixMap,
          requireWellFormed,
          refs
        );
      }
      return markup;
    }
    case NODE_TYPES.TEXT_NODE:
      //TODO: Check XML Char production
      return node.data
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    case NODE_TYPES.COMMENT_NODE:
      //TODO: Check XML Char production
      if (
        requireWellFormed &&
        (node.data.includes("--") || node.data.endsWith("-"))
      ) {
        throw new Error("Found hyphens in illegal places");
      }
      return `<!--${node.data}-->`;
    case NODE_TYPES.ELEMENT_NODE:
      if (
        requireWellFormed &&
        (node.localName.includes(":") || xnv.name(node.localName))
      ) {
        throw new DOMException(
          "localName is not a valid XML name",
          "InvalidStateError"
        );
      }
      let markup = "<";
      let qualifiedName = "";
      let skipEndTag = false;
      let ignoreNamespaceDefinitionAttr = false;
      const map = Object.assign({}, prefixMap);
      const localPrefixesMap = Object.create(null);
      const localDefaultNamespace = recordNamespaceInformation(
        node,
        map,
        localPrefixesMap
      );
      let inheritedNs = namespace;
      let ns = node.namespaceURI;
      if (inheritedNs === ns) {
        if (localDefaultNamespace !== null) {
          ignoreNamespaceDefinitionAttr = true;
        }
        if (ns === NAMESPACES.XML) {
          qualifiedName = "xml:" + node.localName;
        } else {
          qualifiedName = node.localName;
        }
        markup += qualifiedName;
      } else {
        let prefix = node.prefix;
        let candidatePrefix = attributeUtils.preferredPrefixString(
          map,
          ns,
          prefix
        );
        if (prefix === "xmlns") {
          if (requireWellFormed) {
            throw new Error("Elements can't have xmlns prefix");
          }
          candidatePrefix = "xmlns";
        }
        if (candidatePrefix !== null) {
          qualifiedName = candidatePrefix + ":" + node.localName;
          if (
            localDefaultNamespace !== null &&
            localDefaultNamespace != NAMESPACES.XML
          ) {
            inheritedNs =
              localDefaultNamespace === "" ? null : localDefaultNamespace;
          }
          markup += qualifiedName;
        } else if (prefix !== null) {
          if (prefix in localPrefixesMap) {
            prefix = attributeUtils.generatePrefix(map, ns, refs.prefixIndex++);
          }
          map[ns].push(prefix);
          qualifiedName = prefix + ":" + node.localName;
          markup += `${qualifiedName} xmlns:${prefix}="${attributeUtils.serializeAttributeValue(
            ns,
            requireWellFormed
          )}"`;
          if (localDefaultNamespace !== null) {
            inheritedNs =
              localDefaultNamespace === "" ? null : localDefaultNamespace;
          }
        } else if (
          localDefaultNamespace === null ||
          localDefaultNamespace !== ns
        ) {
          ignoreNamespaceDefinitionAttr = true;
          qualifiedName = node.localName;
          inheritedNs = ns;
          markup += `${qualifiedName} xmlns="${attributeUtils.serializeAttributeValue(
            ns,
            requireWellFormed
          )}"`;
        } else {
          qualifiedName = node.localName;
          inheritedNs = ns;
          markup += qualifiedName;
        }
      }

      markup += attributeUtils.serializeAttributes(
        node,
        map,
        localPrefixesMap,
        ignoreNamespaceDefinitionAttr,
        requireWellFormed,
        refs
      );

      if (
        ns === NAMESPACES.HTML &&
        node.childNodes.length === 0 &&
        VOID_ELEMENTS.has(node.localName)
      ) {
        markup += " /";
        skipEndTag = true;
      } else if (ns !== NAMESPACES.HTML && node.childNodes.length === 0) {
        markup += "/";
        skipEndTag = true;
      }
      markup += ">";
      if (skipEndTag) {
        return markup;
      }

      if (ns === NAMESPACES.HTML && node.localName === "template") {
        markup += xmlSerialization(
          node.content,
          inheritedNs,
          map,
          requireWellFormed,
          refs
        );
      } else {
        for (const child of node.childNodes) {
          markup += xmlSerialization(
            child,
            inheritedNs,
            map,
            requireWellFormed,
            refs
          );
        }
      }
      markup += `</${qualifiedName}>`;
      return markup;
  }
}

function produceXmlSerialization(root, requireWellFormed) {
  const namespacePrefixMap = Object.create(null);
  namespacePrefixMap["http://www.w3.org/XML/1998/namespace"] = ["xml"];
  return xmlSerialization(root, null, namespacePrefixMap, requireWellFormed, {
    prefixIndex: 1
  });
}

exports.implementation = class XMLSerializerImpl {
  serializeToString(root) {
    return produceXmlSerialization(root, false);
  }
};
