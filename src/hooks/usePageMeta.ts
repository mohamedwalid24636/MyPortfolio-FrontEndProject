import { useEffect } from "react";

function setMetaTag(selector: string, attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/** Keeps the document title and social meta tags in sync with the active route. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      setMetaTag('meta[name="description"]', "name", "description", description);
      setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    }
    setMetaTag('meta[property="og:title"]', "property", "og:title", title);
  }, [title, description]);
}
