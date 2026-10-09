import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for blog content.
 *
 * The content is authored through the admin API, but it is still rendered as
 * React elements (never `dangerouslySetInnerHTML`), so no HTML can be injected
 * into the page. Supported: headings, bold, italics, inline code, links,
 * bullet/numbered lists, blockquotes, fenced code blocks and paragraphs.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-inline-${index++}`;

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-fg">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[0.9em] text-accent-200">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const splitIndex = token.indexOf("](");
      const label = token.slice(1, splitIndex);
      const href = token.slice(splitIndex + 2, -1);
      nodes.push(
        <a
          key={key}
          href={href}
          target={isExternalHref(href) ? "_blank" : undefined}
          rel={isExternalHref(href) ? "noreferrer noopener" : undefined}
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

interface ProseContentProps {
  content: string | null | undefined;
}

export function ProseContent({ content }: ProseContentProps) {
  if (!content || !content.trim()) {
    return <p className="text-fg-muted">This article has no content yet.</p>;
  }

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  const listBuffer: { type: "ul" | "ol"; items: string[] }[] = [];
  let paragraphBuffer: string[] = [];
  let codeBuffer: string[] | null = null;
  let blockIndex = 0;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push(
      <p key={`p-${blockIndex++}`}>{renderInline(paragraphBuffer.join(" "), `p${blockIndex}`)}</p>,
    );
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const { type, items } = listBuffer[0];
    const Tag = type;
    blocks.push(
      <Tag key={`l-${blockIndex++}`}>
        {items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInline(item, `l${blockIndex}-${itemIndex}`)}</li>
        ))}
      </Tag>,
    );
    listBuffer.length = 0;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  // Normalize heading levels against the shallowest heading the author actually used, so the first
  // body heading always maps to `h2` (the article's own title owns the page's only `h1`). Without
  // this, an article written with `##` would emit `h3` first and skip a level.
  const headingLevels = lines
    .map((rawLine) => /^(#{1,4})\s+\S/.exec(rawLine.trim())?.[1].length)
    .filter((value): value is number => typeof value === "number");
  const minHeadingLevel = headingLevels.length > 0 ? Math.min(...headingLevels) : 2;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (codeBuffer !== null) {
      if (line.startsWith("```")) {
        blocks.push(
          <pre key={`code-${blockIndex++}`}>
            <code>{codeBuffer.join("\n")}</code>
          </pre>,
        );
        codeBuffer = null;
      } else {
        codeBuffer.push(rawLine);
      }
      continue;
    }

    if (line.startsWith("```")) {
      flushAll();
      codeBuffer = [];
      continue;
    }

    if (line.length === 0) {
      flushAll();
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const content2 = headingMatch[2];
      const sizes = ["text-2xl", "text-xl", "text-lg", "text-base"];
      const outputLevel = Math.min(Math.max(level - minHeadingLevel + 2, 2), 6);
      const Heading = `h${outputLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
      blocks.push(
        <Heading
          key={`h-${blockIndex++}`}
          className={`${sizes[Math.min(outputLevel - 2, sizes.length - 1)]} font-semibold text-fg mt-8 mb-2`}
        >
          {renderInline(content2, `h${blockIndex}`)}
        </Heading>,
      );
      continue;
    }

    if (line.startsWith(">")) {
      flushAll();
      blocks.push(
        <blockquote key={`q-${blockIndex++}`}>{renderInline(line.replace(/^>\s?/, ""), `q${blockIndex}`)}</blockquote>,
      );
      continue;
    }

    const bulletMatch = /^[-*+]\s+(.*)$/.exec(line);
    const orderedMatch = /^\d+[.)]\s+(.*)$/.exec(line);

    if (bulletMatch || orderedMatch) {
      flushParagraph();
      const type: "ul" | "ol" = bulletMatch ? "ul" : "ol";
      const value = (bulletMatch ?? orderedMatch)![1];

      const current = listBuffer[0];
      if (current && current.type === type) {
        current.items.push(value);
      } else {
        flushList();
        listBuffer.push({ type, items: [value] });
      }
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  if (codeBuffer !== null) {
    blocks.push(
      <pre key={`code-${blockIndex++}`}>
        <code>{codeBuffer.join("\n")}</code>
      </pre>,
    );
  }
  flushAll();

  return <div className="prose-content">{blocks.map((block, index) => <Fragment key={index}>{block}</Fragment>)}</div>;
}
