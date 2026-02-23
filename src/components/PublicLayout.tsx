// FILE: src/components/PublicLayout.tsx
import React from "react";
import { Outlet, Link } from "react-router-dom";
import "../screens/Home.css";

/* === Social icons (same as Home) === */
type SocialKind = "instagram" | "facebook" | "tiktok" | "linkedin" | "youtube";

function SocialIcon({ kind, href }: { kind: SocialKind; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={kind}
      className="social-btn"
      title={kind.charAt(0).toUpperCase() + kind.slice(1)}
    >
      {kind === "instagram" && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 2.5A4.5 4.5 0 1 0 16.5 11 4.5 4.5 0 0 0 12 6.5zm0 2A2.5 2.5 0 1 1 9.5 11 2.5 2.5 0 0 1 12 8.5zm4.8-3.1a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1z"
          />
        </svg>
      )}
      {kind === "facebook" && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12H10.4V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12Z"
          />
        </svg>
      )}
      {kind === "tiktok" && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20 8.2a6.7 6.7 0 0 1-3.8-1.2v7.2c0 3-2.5 5.6-5.6 5.6S5 17.2 5 14.1s2.5-5.6 5.6-5.6c.4 0 .9 0 1.3.1v2.7a3 3 0 0 0-1.3-.3c-1.6 0-2.9 1.3-2.9 3s1.3 3 3 3c1.6 0 2.9-1.3 2.9-3V3.3h2.6A4 4 0 0 0 18 6a4 4 0 0 0 2 .5V8.2Z"
          />
        </svg>
      )}
      {kind === "linkedin" && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.98 3.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5ZM3.5 9h3v12h-3V9Zm6 0h2.9v1.6h.1c.4-.8 1.6-1.7 3.2-1.7 3.4 0 4 2.2 4 5v7.1h-3V14.8c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-3V9Z"
          />
        </svg>
      )}
      {kind === "youtube" && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M23 12s0-3-.4-4.4c-.2-.9-.9-1.6-1.8-1.8C18.4 5.3 12 5.3 12 5.3s-6.4 0-8.8.5c-.9.2-1.6.9-1.8 1.8C1 9 1 12 1 12s0 3 .4 4.4c.2.9.9 1.6 1.8 1.8 2.4.5 8.8.5 8.8.5s6.4 0 8.8-.5c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.4.4-4.4ZM9.8 15.3V8.7l6.1 3.3-6.1 3.3Z"
          />
        </svg>
      )}
    </a>
  );
}

/* === Small modern header icon links (HEADER ONLY) === */
function HeaderIconLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(255, 220, 0, 0.85)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    lineHeight: 1,
    boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    whiteSpace: "nowrap",
    transition: "background 160ms ease, color 160ms ease, transform 160ms ease, border-color 160ms ease",
  };

  const iconWrapBase: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#FFDC00",
    color: "#000",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    transition: "background 160ms ease, color 160ms ease",
  };

  const textStyle: React.CSSProperties = {
    fontSize: 14,
    letterSpacing: 0.2,
  };

  return (
    <Link
      to={to}
      style={baseStyle}
      title={label}
      aria-label={label}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "#ffffff";
        el.style.color = "#000000";
        el.style.borderColor = "rgba(255,255,255,0.95)";
        el.style.transform = "translateY(-1px)";

        const iconEl = el.querySelector(".header-icon-wrap") as HTMLSpanElement | null;
        if (iconEl) {
          iconEl.style.background = "#000000";
          iconEl.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "rgba(0,0,0,0.55)";
        el.style.color = "#ffffff";
        el.style.borderColor = "rgba(255, 220, 0, 0.85)";
        el.style.transform = "translateY(0px)";

        const iconEl = el.querySelector(".header-icon-wrap") as HTMLSpanElement | null;
        if (iconEl) {
          iconEl.style.background = "#FFDC00";
          iconEl.style.color = "#000000";
        }
      }}
    >
      <span className="header-icon-wrap" style={iconWrapBase}>
        {icon}
      </span>
      <span style={textStyle}>{label}</span>
    </Link>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM7 12h10v2H7v-2Zm0 4h10v2H7v-2Zm0-8h6v2H7V8Z"
      />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2 20 6v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Zm0 2.2L6 7v5c0 3.9 2.5 7.4 6 8 3.5-.6 6-4.1 6-8V7l-6-2.8Z"
      />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"
      />
    </svg>
  );
}

export default function PublicLayout() {
  const socials = {
    facebook: "https://www.facebook.com/hilbuapp/",
    instagram: "https://www.instagram.com/hilbu_app/",
    linkedin: "https://www.linkedin.com/company/hilbu/",
    tiktok: "https://www.tiktok.com/@hilbu_app",
    youtube: "https://www.youtube.com/@HILBU_APP",
  };

  return (
    <div className="home-container">
      {/* ===== Fixed Header (GLOBAL) ===== */}
      <div className="site-header">
        <div className="header-left">
          {/* Click logo -> Home */}
          <Link
            to="/"
            aria-label="Go to Home"
            title="Home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img src="/icon.png" alt="HILBU" className="header-logo" />
          </Link>

          <div className="header-tagline">Your Trusted Car Recovery Partner</div>
        </div>

        <nav className="header-right" aria-label="Header navigation">
          {/* Modern small links (same routes) */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginRight: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <HeaderIconLink to="/terms" label="Terms" icon={<DocIcon />} />
            <HeaderIconLink to="/privacy" label="Privacy" icon={<ShieldIcon />} />
            <HeaderIconLink to="/contact" label="Contact" icon={<MailIcon />} />
          </div>

          <div className="socials header-socials">
            <SocialIcon kind="instagram" href={socials.instagram} />
            <SocialIcon kind="facebook" href={socials.facebook} />
            <SocialIcon kind="tiktok" href={socials.tiktok} />
            <SocialIcon kind="linkedin" href={socials.linkedin} />
            <SocialIcon kind="youtube" href={socials.youtube} />
          </div>
        </nav>
      </div>

      <div className="header-spacer" />

      {/* Page content */}
      <Outlet />

      {/* ===== Footer (GLOBAL) - KEEP ORIGINAL ===== */}
      <footer className="home-footer">
        <div className="footer-left">
          <img src="/icon.png" alt="HILBU" className="footer-logo" />
          <span>© {new Date().getFullYear()} HILBU Technologies</span>
        </div>

        <div className="socials footer-socials footer-socials-top">
          <SocialIcon kind="instagram" href={socials.instagram} />
          <SocialIcon kind="facebook" href={socials.facebook} />
          <SocialIcon kind="tiktok" href={socials.tiktok} />
          <SocialIcon kind="linkedin" href={socials.linkedin} />
          <SocialIcon kind="youtube" href={socials.youtube} />
        </div>

        <div className="footer-links footer-links-bottom">
          <Link to="/terms" className="footer-link">
            Terms &amp; Conditions
          </Link>
          <Link to="/privacy" className="footer-link">
            Privacy Policy
          </Link>
          <Link to="/contact" className="footer-link">
            Contact Us
          </Link>
        </div>
      </footer>
    </div>
  );
}