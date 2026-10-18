const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#x2f;": "/",
  "&#x5c;": "\\",
  "&#x3d;": "=",
};

export default function decodeHtmlEntities(value) {
  return String(value ?? "").replace(
    /&(amp|lt|gt|quot|#x27|#x2f|#x5c|#x3d);/gi,
    (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? entity,
  );
}
