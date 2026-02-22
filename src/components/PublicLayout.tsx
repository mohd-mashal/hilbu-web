// FILE: src/components/PublicLayout.tsx
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
          <img src="/icon.png" alt="HILBU" className="header-logo" />
          <div className="header-tagline">Your Trusted Car Recovery Partner</div>
        </div>

        <nav className="header-right">
          <Link to="/terms" className="header-pill">
            Terms &amp; Conditions
          </Link>
          <Link to="/privacy" className="header-pill">
            Privacy Policy
          </Link>
          <Link to="/contact" className="header-pill">
            Contact Us
          </Link>

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

      {/* ===== Footer (GLOBAL) ===== */}
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