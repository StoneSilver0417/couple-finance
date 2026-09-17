import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { privacyPolicySections } from "@/lib/privacy-policy";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 부부가계부",
  description:
    "부부가계부(couple-finance)의 개인정보 수집, 이용, 보관 및 보호에 관한 안내입니다.",
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-mesh px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent-violet/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-3xl">
        <Button
          asChild
          variant="ghost"
          className="mb-6 min-h-11 rounded-full bg-white/70 px-4 text-text-main shadow-soft hover:bg-white"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            서비스로 돌아가기
          </Link>
        </Button>

        <header className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-dark to-primary text-white shadow-candy">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-dark">
            Privacy Policy
          </p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-text-main sm:text-4xl">
            개인정보 처리방침
          </h1>
          <p className="mx-auto mt-3 max-w-2xl break-keep text-sm leading-6 text-text-secondary sm:text-base">
            부부가계부는 이용자의 개인정보를 소중히 여기며, 개인정보보호법 등
            관련 법령을 준수합니다.
          </p>
          <p className="mt-3 text-xs font-semibold text-text-secondary">
            시행일: 2026년 9월 17일
          </p>
        </header>

        <nav
          aria-label="개인정보 처리방침 목차"
          className="glass-panel mb-6 rounded-3xl border border-white/60 p-5 shadow-soft sm:p-6"
        >
          <p className="mb-3 text-sm font-bold text-text-main">목차</p>
          <ol className="grid gap-1 sm:grid-cols-2">
            {privacyPolicySections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="glass-panel rounded-[2rem] border border-white/60 p-5 shadow-glass sm:p-8">
          <div className="space-y-10">
            {privacyPolicySections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-6"
                aria-labelledby={`${section.id}-title`}
              >
                <h2
                  id={`${section.id}-title`}
                  className="mb-4 break-keep text-xl font-extrabold leading-7 text-text-main sm:text-2xl"
                >
                  {index + 1}. {section.title}
                </h2>

                <div className="space-y-3 break-keep text-base leading-7 text-text-secondary">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span
                            className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.processors && (
                    <div className="overflow-hidden rounded-2xl border border-primary-soft/70 bg-white/60">
                      {section.processors.map((processor) => (
                        <div
                          key={processor.name}
                          className="grid gap-1 border-b border-primary-soft/50 p-4 last:border-b-0 sm:grid-cols-[8rem_1fr] sm:gap-4"
                        >
                          <strong className="text-text-main">
                            {processor.name}
                          </strong>
                          <span>{processor.purpose}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.email && (
                    <a
                      href={`mailto:${section.email}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 font-bold text-primary-dark transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {section.email}
                    </a>
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>

        <footer className="py-8 text-center text-xs font-medium text-text-secondary">
          © 2026 Couple Finance. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
