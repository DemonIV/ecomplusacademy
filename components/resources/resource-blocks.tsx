import { LineIcon } from "@/components/ui/line-icon";
import { COPY } from "@/content/copy";
import type { ResourceBlock } from "@/content/resources";

const T = COPY.resources;

/** The body of a resource page, one block after another (types in content/resources.ts). */
export function ResourceBlocks({ blocks }: { blocks: readonly ResourceBlock[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ResourceBlock }) {
  switch (block.type) {
    case "text":
      return <p className="measure text-paper/90">{block.text}</p>;

    case "steps":
      return (
        <section>
          {block.title && <h2 className="t-h3 mb-4">{block.title}</h2>}
          <ol className="space-y-3">
            {block.items.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-panel/60 p-4 sm:p-5">
                <span className="t-num grid size-8 flex-none place-items-center rounded-full border border-gold/50 text-sm text-gold">
                  {index + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </section>
      );

    case "items":
      return (
        <section>
          {block.title && <h2 className="t-h3 mb-4">{block.title}</h2>}
          <ul className="grid gap-3 sm:grid-cols-2">
            {block.items.map((item) => (
              <li key={item.title} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-panel/60 p-5">
                <span className="font-semibold">{item.title}</span>
                {item.text && <span className="mt-1.5 text-muted">{item.text}</span>}
                {item.href && (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-gold hover:text-paper"
                  >
                    {T.open}
                    <LineIcon id="external" className="size-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      );

    case "file":
    case "link": {
      const isFile = block.type === "file";
      return (
        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line-strong bg-panel/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LineIcon id={isFile ? "download" : "external"} className="mt-0.5 size-6 flex-none text-gold" />
            <div>
              <p className="font-semibold">{block.label}</p>
              {block.note && <p className="mt-1 text-sm text-muted">{block.note}</p>}
            </div>
          </div>
          <a
            href={block.href}
            {...(isFile ? { download: "" } : { target: "_blank", rel: "noopener" })}
            className="btn btn-gold btn-sm self-start sm:self-auto"
          >
            {isFile ? T.download : T.open}
          </a>
        </div>
      );
    }
  }
}
