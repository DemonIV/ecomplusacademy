"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent } from "react";
import { ResourceTile } from "@/components/resources/resource-cover";
import { LineIcon } from "@/components/ui/line-icon";
import { COPY } from "@/content/copy";
import { trackEvent } from "@/lib/meta/fbq";
import { META_EVENTS } from "@/lib/meta/events";
import { searchResources, type ResourceCard } from "@/lib/resources";

const T = COPY.resources;

/**
 * "Type the word from the video": the grid narrows while the visitor types,
 * enter opens the matching resource. The pinned first tile leads into the
 * application, like a pinned post on a profile.
 */
export function ResourceLibrary({ resources }: { resources: ResourceCard[] }) {
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [missed, setMissed] = useState(false);
  const { exact, matches } = useMemo(() => searchResources(query, resources), [query, resources]);
  const searching = query.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const typed = query.trim();
    if (!typed) return;
    trackEvent(META_EVENTS.search, { search_string: typed.slice(0, 60), content_category: "kaynak" });
    if (exact) router.push(`/kaynaklar/${exact.slug}`);
    else setMissed(true);
  };

  return (
    <>
      <form onSubmit={submit} className="mt-8" role="search">
        <label htmlFor={inputId} className="font-semibold">
          {T.search.label}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={inputId}
            type="search"
            className="field uppercase placeholder:normal-case"
            placeholder={T.search.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMissed(false);
            }}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            maxLength={40}
          />
          <button type="submit" className="btn btn-gold flex-none">
            {T.search.submit}
          </button>
        </div>
        {(missed || (searching && matches.length === 0)) && (
          <p className="mt-3 text-sm text-muted" role="status">
            {T.search.noMatch}
          </p>
        )}
      </form>

      <div className="mt-10 flex items-center justify-center gap-2 border-t border-line pt-4 text-xs font-bold uppercase tracking-[0.12em] text-paper">
        <LineIcon id="grid" className="size-4" />
        {T.gridLabel}
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-x-2 gap-y-5 sm:gap-x-4 md:gap-x-5">
        {!searching && (
          <li>
            <Link href="/#basvuru" className="group block rounded-[12px]">
              <span className="cover cover-pinned aspect-square">
                <LineIcon id="pin" className="absolute right-[7cqi] top-[7cqi] size-[max(0.9rem,9cqi)]" />
                <span className="px-[8cqi] text-center">
                  <span className="block font-display text-[max(0.95rem,12cqi)] font-semibold leading-[1.05] tracking-[-0.03em]">
                    {T.pinned.title}
                  </span>
                  <span className="mt-[4cqi] block text-[max(0.65rem,6.5cqi)] font-bold">{T.pinned.text}</span>
                </span>
              </span>
              <span className="mt-2 line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-gold sm:text-sm">
                {T.applyCta}
              </span>
            </Link>
          </li>
        )}
        {(searching ? matches : resources).map((resource) => (
          <li key={resource.slug}>
            <ResourceTile resource={resource} />
          </li>
        ))}
      </ul>
    </>
  );
}
