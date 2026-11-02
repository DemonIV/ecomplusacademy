import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { SITE } from "@/config/site";
import { formatPhone, whatsappLink } from "@/lib/phone";

export function Footer() {
  const { footer } = COPY;
  return (
    <footer className="border-t border-line bg-deep pb-28 pt-16 md:pb-12">
      <div className="shell">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Logo variant="stacked" className="w-40" />
            <p className="mt-5 max-w-sm text-muted">{BRAND.tagline}</p>
          </div>
          <div>
            <p className="font-semibold">İletişim</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>
                <a className="hover:text-paper" href={`mailto:${BRAND.contact.email}`}>
                  {BRAND.contact.email}
                </a>
              </li>
              <li>
                <a className="hover:text-paper" href={whatsappLink(BRAND.contact.whatsapp)} rel="noopener" target="_blank">
                  WhatsApp {formatPhone(BRAND.contact.whatsapp)}
                </a>
              </li>
              <li>
                <a className="hover:text-paper" href={BRAND.social.instagram} rel="noopener" target="_blank">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Yasal</p>
            <ul className="mt-3 space-y-2 text-muted">
              {footer.legal.map((link) => (
                <li key={link.href}>
                  <Link className="hover:text-paper" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="hairline my-10" />
        <p className="max-w-[70ch] text-sm leading-relaxed text-faint">{footer.disclaimer}</p>
        <p className="mt-6 text-sm text-faint">
          © {SITE.copyrightYear} {BRAND.legalName} · {BRAND.contact.address} · MERSİS: {BRAND.contact.mersis}
        </p>
      </div>
    </footer>
  );
}
