# W3C-XMLSERIALIZER

A javascript XML serializer that follows the [w3c specifications](https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml).

## Basic usage

```javascript
import {XMLSerializer} from "w3c-xmlserializer";
import { JSDOM } from "jsdom";

const document = new JSDOM().window.document;
const SerializerInterface = XMLSerializer.interface;
const serializer = new SerializerInterface();
const doc = document.createElement("akomaNtoso");

console.log(serializer.serializeToString(doc))
// <akomantoso xmlns="http://www.w3.org/1999/xhtml"></akomantoso>
```
