import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

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
            <div
              className="qrCanvasWrap"
              style={{ width: QR_SIZE, height: QR_SIZE }}
            >
              <img
                src={qrUrl}
                alt={`${label} QR`}
                className="qrImg"
                style={{ width: QR_SIZE, height: QR_SIZE }}
              />
              <div
                className="qrLogoWrap"
                style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
              >
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
    <>
      {/* ===== Hero ===== */}
      <section className="hero section-gap">
        <div className="hero-left">
          <h1 className="hero-title">
            Fast • Reliable • 24/7
            <br className="hide-sm" /> Roadside Assistance
          </h1>
          <p className="hero-sub">
            HILBU connects you instantly with professional recovery drivers near
            you. Whether your car breaks down or needs towing — we’re always
            there to help.
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
              See pickup, dropoff, distance, duration, and total price before
              you proceed.
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
              Full history with instant bill download for every completed
              recovery.
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
          <p>Book a recovery in seconds. Track your driver live. Get a clear price upfront.</p>

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
    </>
  );
}