"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./pitch.module.css";

const SLIDE_COUNT = 6;

export default function PitchPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>(
    Array(SLIDE_COUNT).fill(null),
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState<Set<number>>(new Set([0]));

  // Intersection Observer — trigger reveal animations + track active dot
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(
              entry.target as HTMLElement,
            );
            if (index !== -1) {
              setVisibleSlides((prev) => new Set([...prev, index]));
              setCurrentSlide(index);
            }
          }
        });
      },
      { threshold: 0.4, root: container },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, []);

  // Keyboard navigation
  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    slideRefs.current[clamped]?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goTo(currentSlide + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goTo(currentSlide - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlide, goTo]);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    slideRefs.current[i] = el;
  };

  const isVisible = (i: number) => visibleSlides.has(i);

  return (
    <div ref={containerRef} className={styles.pitchContainer}>
      {/* Navigation dots */}
      <div className={styles.progressDots}>
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${currentSlide === i ? styles.dotActive : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Slide 1: Title ── */}
      <section ref={setRef(0)} className={styles.slide}>
        <div className={styles.gridBg} />
        <div
          className={`${styles.slideContent} ${isVisible(0) ? styles.visible : ""}`}
        >
          <div
            className={`${styles.reveal} ${styles.mono}`}
            style={{
              fontSize: "clamp(0.55rem, 0.85vw, 0.68rem)",
              color: "#ccc",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            Chainlink Convergence 2026
          </div>
          <h1
            className={`${styles.reveal} ${styles.title}`}
            style={{ transitionDelay: "0.1s" }}
          >
            Surely
          </h1>
          <p
            className={`${styles.reveal} ${styles.subtitle}`}
            style={{ transitionDelay: "0.22s" }}
          >
            Parametric insurance.
            <br />
            No claims. No adjusters. No waiting.
          </p>
          <div
            className={`${styles.reveal} ${styles.tagLine}`}
            style={{ transitionDelay: "0.38s" }}
          >
            <span className={styles.tag}>Chainlink CRE</span>
            <span className={styles.tagDivider}>·</span>
            <span className={styles.tag}>Avalanche Fuji</span>
            <span className={styles.tagDivider}>·</span>
            <span className={styles.tag}>AI Adjudication</span>
            <span className={styles.tagDivider}>·</span>
            <span className={styles.tag}>On-chain ACE</span>
          </div>
        </div>
      </section>

      {/* ── Slide 2: Problem ── */}
      <section ref={setRef(1)} className={styles.slide}>
        <div className={styles.gridBg} />
        <div
          className={`${styles.slideContent} ${isVisible(1) ? styles.visible : ""}`}
        >
          <div className={`${styles.reveal} ${styles.eyebrow}`}>
            The Problem
          </div>
          <div
            className={`${styles.reveal} ${styles.problemLines}`}
            style={{ transitionDelay: "0.08s" }}
          >
            <p className={styles.problemLine}>Flood hits Bangladesh.</p>
            <p className={`${styles.problemLine} ${styles.dim}`}>
              Claim filed. Adjusters dispatched.
            </p>
            <p className={`${styles.problemLine} ${styles.dimmer}`}>
              Payment arrives. <em>8 months later.</em>
            </p>
          </div>
          <p
            className={`${styles.reveal} ${styles.body}`}
            style={{ transitionDelay: "0.22s" }}
          >
            The trigger was verifiable. The payout was inevitable.
            <br />
            The wait was inexcusable.
          </p>
        </div>
      </section>

      {/* ── Slide 3: Solution ── */}
      <section ref={setRef(2)} className={styles.slide}>
        <div className={styles.gridBg} />
        <div
          className={`${styles.slideContent} ${isVisible(2) ? styles.visible : ""}`}
        >
          <div className={`${styles.reveal} ${styles.eyebrow}`}>Surely</div>
          <h2
            className={`${styles.reveal} ${styles.heading}`}
            style={{ transitionDelay: "0.1s" }}
          >
            Condition triggers.
            <br />
            Payout executes.
          </h2>
          <p
            className={`${styles.reveal} ${styles.body}`}
            style={{ transitionDelay: "0.2s" }}
          >
            Chainlink CRE monitors real-world data inside a TEE. When the
            trigger fires — price crash, flight delay, weather event — consensus
            is reached and the pool settles on-chain. Automatically.
          </p>
          <div
            className={`${styles.reveal} ${styles.flowDiagram}`}
            style={{ transitionDelay: "0.32s" }}
          >
            <div className={styles.flowStep}>
              <div className={styles.flowLabel}>Monitor</div>
              <div className={styles.flowDesc}>
                CRE Cron + HTTP Client pulls multi-source data on every cadence
                tick
              </div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowStep}>
              <div className={styles.flowLabel}>Consensus</div>
              <div className={styles.flowDesc}>
                TEE-attested median / majority across sources. 80%+ confidence
                required.
              </div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowStep}>
              <div className={styles.flowLabel}>Settle</div>
              <div className={styles.flowDesc}>
                CRERouter routes result to pool. CZUSD payouts execute
                instantly.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Slide 4: ACE ── */}
      <section ref={setRef(3)} className={styles.slide}>
        <div className={styles.gridBg} />
        <div
          className={`${styles.slideContent} ${isVisible(3) ? styles.visible : ""}`}
        >
          <div className={`${styles.reveal} ${styles.eyebrow}`}>
            ACE — Autonomous Compliance Engine
          </div>
          <h2
            className={`${styles.reveal} ${styles.heading}`}
            style={{ transitionDelay: "0.1s" }}
          >
            Compliance by design.
          </h2>
          <p
            className={`${styles.reveal} ${styles.body}`}
            style={{ transitionDelay: "0.2s" }}
          >
            Chainlink&apos;s ACE autonomously enforces compliance on every
            transaction — no human in the loop. Policies compose on-chain and
            are driven by CRE compliance workflows.
          </p>
          <div
            className={`${styles.reveal} ${styles.policies}`}
            style={{ transitionDelay: "0.32s" }}
          >
            {[
              {
                label: "Sanctions Screening",
                desc: "OFAC-style deny list. Blocks minting before funds reach any pool.",
              },
              {
                label: "KYC Gating",
                desc: "CRE-verified credentials. Revocable. Stored on-chain.",
              },
              {
                label: "Cooling-Off Periods",
                desc: "14-day re-entry guard. Prevents claim-then-re-enter gaming.",
              },
              {
                label: "Solvency Ratio",
                desc: "120% collateral minimum. Underwriting integrity enforced.",
              },
            ].map((p, i) => (
              <div key={i} className={styles.policyCard}>
                <div className={styles.policyLabel}>{p.label}</div>
                <div className={styles.policyDesc}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Slide 5: Stack ── */}
      <section ref={setRef(4)} className={styles.slide}>
        <div className={styles.gridBg} />
        <div
          className={`${styles.slideContent} ${isVisible(4) ? styles.visible : ""}`}
        >
          <div className={`${styles.reveal} ${styles.eyebrow}`}>Stack</div>
          <div
            className={`${styles.reveal} ${styles.stackGrid}`}
            style={{ transitionDelay: "0.1s" }}
          >
            {[
              {
                cat: "Automation",
                val: "Chainlink CRE — Cron Trigger · HTTP Client · EVM Write · TEE Consensus",
              },
              {
                cat: "Chain",
                val: "Avalanche Fuji — InsurancePool · PolicyNFT · CZUSD · CRERouter · ACE",
              },
              {
                cat: "AI",
                val: "Gemini in TEE enclave — adjudication oracle for edge-case settlements",
              },
              {
                cat: "Payments",
                val: "CZUSD protocol stablecoin · Stripe on-ramp",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={styles.stackRow}
                style={{ transitionDelay: `${0.12 + i * 0.06}s` }}
              >
                <span className={styles.stackCat}>{item.cat}</span>
                <span className={styles.stackVal}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Slide 6: Demo ── */}
      <section ref={setRef(5)} className={styles.slide}>
        <div className={styles.gridBg} />
        <div
          className={`${styles.slideContent} ${styles.centered} ${isVisible(5) ? styles.visible : ""}`}
        >
          <div className={`${styles.reveal} ${styles.demoLabel}`}>
            live demo
          </div>
          <h2
            className={`${styles.reveal} ${styles.demoHeading}`}
            style={{ transitionDelay: "0.14s" }}
          >
            Let&apos;s see it.
          </h2>
          <p
            className={`${styles.reveal} ${styles.demoPools}`}
            style={{ transitionDelay: "0.3s" }}
          >
            BTC Crash Pool · USDC Depeg Shield · Flight Delay Cover
          </p>
        </div>
      </section>
    </div>
  );
}
