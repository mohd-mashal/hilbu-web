import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

/* === Social icons === */
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
      {/* SVGs use currentColor to match button color */}
      {kind === "instagram" && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2.8c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.5.6.2 1 .5 1.5 1s.7.9 1 1.5c.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.5 2.4-.2.6-.5 1-1 1.5s-.9.7-1.5 1c-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.5-.6-.2-1-.5-1.5-1s-.7-.9-1-1.5c-.2-.5-.4-1.2-.5-2.4C2.8 15.6 2.8 15.2 2.8 12s0-3.6.1-4.9c.1-1.2.2-1.9.5-2.4.2-.6.5-1 1-1.5s.9-.7 1.5-1c.5-.2 1.2-.4 2.4-.5C8.4 2.8 8.8 2.8 12 2.8Zm0 1.8c-3.2 0-3.5 0-4.8.1-1 .1-1.6.2-2 .4-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2-.1 1.3-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.6.4 2 .2.5.4.8.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2 .4 1.3.1 1.6.1 4.8.1s3.5 0 4.8-.1c1-.1 1.6-.2 2-.4.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2 .1-1.3.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.6-.4-2-.2-.5-.4-.8-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2-.4-1.3-.1-1.6-.1-4.8-.1Zm0 3.4A6.99 6.99 0 1 1 12 19a6.99 6.99 0 0 1 0-14Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm5.7-1.2a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0Z"
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

/* === Store badges with QR (used in CTA band) === */
function StoreBadgeWithQR({
  imgSrc,
  alt,
  href,
  label,
}: {
  imgSrc: string;
  alt: string;
  href: string;
  label: "iPhone" | "Android";
}) {
  const [show, setShow] = useState(false);
  const [allowHover, setAllowHover] = useState(true);

  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia("(hover: hover)");
      setAllowHover(!!mq?.matches);
    } catch {
      setAllowHover(true);
    }
  }, []);

  const QR_SIZE = 300;
  const LOGO_SIZE = 54;
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?` +
    `size=${QR_SIZE}x${QR_SIZE}&margin=8&ecc=H&format=png&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(
      href
    )}`;

  return (
    <div
      className="storeBadgeWrap"
      onMouseEnter={() => allowHover && setShow(true)}
      onMouseLeave={() => allowHover && setShow(false)}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={alt}
        className="storeBadgeLink"
      >
        <img src={imgSrc} alt={alt} className="storeMiniIconActive" />
      </a>

      {allowHover && show && (
        <div className="qrPopover">
          <div className="qrBox">
            <div className="qrCanvasWrap" style={{ width: QR_SIZE, height: QR_SIZE }}>
              <img
                src={qrUrl}
                alt={`${label} QR`}
                className="qrImg"
                style={{ width: QR_SIZE, height: QR_SIZE }}
              />
              <div className="qrLogoWrap" style={{ width: LOGO_SIZE, height: LOGO_SIZE }}>
                <img
                  src="/InvoiceLogo.png"
                  alt="HILBU"
                  className="qrLogo"
                  style={{ width: LOGO_SIZE - 6, height: LOGO_SIZE - 6 }}
                />
              </div>
            </div>
            <div className="qrLabelSmall">{label}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const IOS_URL =
    "https://apps.apple.com/us/app/hilbu/id6751604180?platform=iphone";
  const ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.hilbu.recovery";

  /* Replace these URLs with your real profiles */
  const socials = {
    instagram: "https://instagram.com/hilbu",
    facebook: "https://facebook.com/hilbu",
    tiktok: "https://www.tiktok.com/@hilbu",
    linkedin: "https://www.linkedin.com/company/hilbu",
    youtube: "https://www.youtube.com/@hilbu",
  };

  return (
    <div className="home-container">
      {/* ===== Fixed Header ===== */}
      <div className="site-header">
        <div className="header-left">
          <img src="/icon.png" alt="HILBU" className="header-logo" />
          <div className="header-tagline">Your Trusted Car Recovery Partner</div>
        </div>

        <nav className="header-right">
          <Link to="/terms" className="header-pill">Terms &amp; Conditions</Link>
          <Link to="/privacy" className="header-pill">Privacy Policy</Link>

          {/* Header Socials */}
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

      {/* ===== Hero ===== */}
      <section className="hero section-gap">
        <div className="hero-left">
          <h1 className="hero-title">
            Fast • Reliable • 24/7<br className="hide-sm" /> Roadside Assistance
          </h1>
          <p className="hero-sub">
            HILBU connects you instantly with professional recovery drivers near you.
            Whether your car breaks down or needs towing — we’re always there to help.
          </p>

          <div className="hero-ctaRow">
            <Link to="/admin">
              <button className="admin-button">🔐 Admin Login</button>
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="shot-pair">
            <div className="shotFrame">
              <img src="/1.png" alt="Get Started in Seconds" className="shot" />
            </div>
            <div className="shotFrame">
              <img src="/2.png" alt="Car Recovery in Seconds" className="shot" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Value Props ===== */}
      <section className="valueProps section-gap">
        <div className="vcard">
          <img src="/fast.png" alt="Instant Help" className="vicon" />
          <h3>Instant Help</h3>
          <p>Get connected with the nearest available recovery truck.</p>
        </div>
        <div className="vcard">
          <img src="/safe.png" alt="Secure & Verified" className="vicon" />
          <h3>Secure &amp; Verified</h3>
          <p>All drivers are verified and tracked through our system.</p>
        </div>
        <div className="vcard">
          <img src="/support.png" alt="24/7 Support" className="vicon" />
          <h3>24/7 Support</h3>
          <p>Day or night, HILBU is always ready to assist you.</p>
        </div>
      </section>

      {/* ===== Feature Screens ===== */}
      <section className="featureScreens section-gap">
        <div className="fs-row">
          <div className="fs-left">
            <h2 className="fs-title">Clear Trip Details</h2>
            <p className="fs-sub">
              See pickup, dropoff, distance, duration, and total price before you proceed.
            </p>
          </div>
          <div className="fs-right">
            <div className="tiltPhone">
              <div className="tiltCircle" />
              <img src="/3.png" alt="Clear Trip Details" className="tiltImage" />
            </div>
          </div>
        </div>

        <div className="fs-row reverse">
          <div className="fs-left">
            <h2 className="fs-title">Track Your Driver Live</h2>
            <p className="fs-sub">
              Follow ETA, cost, and driver info in real time — right on the map.
            </p>
          </div>
          <div className="fs-right">
            <div className="tiltPhone">
              <div className="tiltCircle" />
              <img src="/4.png" alt="Track Your Driver Live" className="tiltImage" />
            </div>
          </div>
        </div>

        <div className="fs-row">
          <div className="fs-left">
            <h2 className="fs-title">Your Trips, Your Records</h2>
            <p className="fs-sub">
              Full history with instant bill download for every completed recovery.
            </p>
          </div>
          <div className="fs-right">
            <div className="tiltPhone">
              <div className="tiltCircle" />
              <img src="/5.png" alt="Your Trips, Your Records" className="tiltImage" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA band ===== */}
      <section className="ctaBand section-gap">
        <div className="ctaText">
          <h2>Ready When You Need Us</h2>
          <p>
            Book a recovery in seconds. Track your driver live. Get a clear price upfront.
          </p>

          <div className="ctaBadges">
            <StoreBadgeWithQR
              imgSrc="/appstore.png"
              alt="Download on the App Store"
              href={IOS_URL}
              label="iPhone"
            />
            <StoreBadgeWithQR
              imgSrc="/playstore.png"
              alt="Get it on Google Play"
              href={ANDROID_URL}
              label="Android"
            />
          </div>
        </div>

        <img src="/hero-truck.png" alt="HILBU tow truck" className="ctaTruck" />
      </section>

      {/* ===== Footer ===== */}
      <footer className="home-footer">
        <div className="footer-left">
          <img src="/icon.png" alt="HILBU" className="footer-logo" />
          <span>© {new Date().getFullYear()} HILBU Technologies</span>
        </div>

        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms &amp; Conditions</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>

          {/* Footer Socials */}
          <div className="socials footer-socials">
            <SocialIcon kind="instagram" href={socials.instagram} />
            <SocialIcon kind="facebook" href={socials.facebook} />
            <SocialIcon kind="tiktok" href={socials.tiktok} />
            <SocialIcon kind="linkedin" href={socials.linkedin} />
            <SocialIcon kind="youtube" href={socials.youtube} />
          </div>
        </div>
      </footer>
    </div>
  );
}
