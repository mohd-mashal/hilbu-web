import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

/* === Store badges with QR (same behavior as admin login) === */
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

  return (
    <div className="home-container">
      {/* ===== Top Header (exactly as requested) ===== */}
      <div className="site-header">
        <div className="header-left">
          <img src="/icon.png" alt="HILBU" className="header-logo" />
          <span className="header-tagline">Your Trusted Car Recovery Partner</span>
        </div>

        <nav className="header-right">
          <Link to="/terms" className="header-pill">Terms &amp; Conditions</Link>
          <Link to="/privacy" className="header-pill">Privacy Policy</Link>
        </nav>
      </div>

      {/* Spacer for fixed header */}
      <div className="header-spacer" />

      {/* ===== Hero ===== */}
      <section className="home-hero">
        <div className="hero-content">
          <h2>Fast • Reliable • 24/7 Roadside Assistance</h2>
          <p className="hero-lead">
            HILBU connects you instantly with professional recovery drivers near
            you. Whether your car breaks down or needs towing — we’re always
            there to help.
          </p>

          <div className="hero-actions">
            <Link to="/admin">
              <button className="admin-button">🔐 Admin Login</button>
            </Link>
          </div>
        </div>

        <img src="/hero-truck.png" alt="Tow Truck" className="hero-image" />
      </section>

      {/* ===== Features ===== */}
      <section className="features">
        <div className="feature-card">
          <img src="/fast.png" alt="Fast" className="feature-icon big" />
          <h3>Instant Help</h3>
          <p>Get connected with the nearest available recovery truck.</p>
        </div>
        <div className="feature-card">
          <img src="/safe.png" alt="Safe" className="feature-icon big" />
          <h3>Secure & Verified</h3>
          <p>All drivers are verified and tracked through our system.</p>
        </div>
        <div className="feature-card">
          <img src="/support.png" alt="Support" className="feature-icon big" />
          <h3>24/7 Support</h3>
          <p>Day or night, HILBU is always ready to assist you.</p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="home-footer">
        <div className="footer-left">
          <img src="/icon.png" alt="HILBU" className="footer-logo" />
          <span>© {new Date().getFullYear()} HILBU Technologies</span>
        </div>

        <div className="footer-stores">
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

        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms &amp; Conditions</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
