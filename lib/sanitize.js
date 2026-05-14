import DOMPurify from "isomorphic-dompurify";

export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html);
}