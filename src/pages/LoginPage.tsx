import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Phone, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setDevLoginSession } from "../features/auth/authSlice";
import { useDevLoginMutation } from "../features/auth/authApi";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { normalizeNumberInput } from "../shared/utils/numberText";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = String(error.status);

    if (status === "404") {
      return "ورود در بک‌اند فعال نیست. لطفاً با مدیر سیستم تماس بگیرید.";
    }

    if (status === "400") {
      return "شماره تلفن پذیرفته نشد. شماره را بدون فاصله وارد کنید.";
    }

    return "خطا در ورود. دوباره تلاش کنید.";
  }

  return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.";
}

function ParticleBackground({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={canvasRef}
    />
  );
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAppSelector((state) => state.auth.token);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hasConfirmedPhone, setHasConfirmedPhone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [devLogin, { error, isLoading }] = useDevLoginMutation();
  const normalizedPhone = useMemo(() => normalizeNumberInput(phoneNumber), [phoneNumber]);
  const canContinue = normalizedPhone.length >= 8 && normalizedPhone.length <= 20;
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/companies";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Three.js particle field
  useEffect(() => {
    let animFrame: number;
    let cleanup: (() => void) | undefined;

    import("three").then((THREE) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 3;

      // Create particle geometry
      const count = 3000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 8;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x10b981,
        size: 0.022,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      // Mouse parallax
      let mouseX = 0;
      let mouseY = 0;
      function onMouseMove(event: MouseEvent) {
        mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
      }
      window.addEventListener("mousemove", onMouseMove, { passive: true });

      function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener("resize", onResize, { passive: true });

      let t = 0;
      function animate() {
        animFrame = requestAnimationFrame(animate);
        t += 0.0008;
        particles.rotation.y = t + mouseX * 0.15;
        particles.rotation.x = mouseY * 0.10;
        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        cancelAnimationFrame(animFrame);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }).catch(() => {
      // Three.js failed to load — background stays plain
    });

    return () => cleanup?.();
  }, []);

  // GSAP entrance animation
  useEffect(() => {
    let cleanupGsap: (() => void) | undefined;

    import("gsap").then(({ gsap }) => {
      if (!cardRef.current) return;
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.1 }
      );
      cleanupGsap = () => gsap.killTweensOf(cardRef.current);
    }).catch(() => {});

    return () => cleanupGsap?.();
  }, []);

  if (token) {
    return <Navigate replace to="/companies" />;
  }

  async function handlePhoneStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!canContinue) {
      setFormError("شماره تلفن باید بین ۸ تا ۲۰ رقم باشد.");
      return;
    }

    setHasConfirmedPhone(true);
  }

  async function handleDevLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!canContinue) {
      setFormError("شماره تلفن باید بین ۸ تا ۲۰ رقم باشد.");
      setHasConfirmedPhone(false);
      return;
    }

    try {
      const result = await devLogin({
        phone_number: normalizedPhone,
        display_name: displayName.trim() || undefined
      }).unwrap();
      dispatch(setDevLoginSession(result));
      navigate(from, { replace: true });
    } catch {
      // RTK Query exposes the request error through `error`; no sensitive values are logged.
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-[#05050a] text-slate-100">
      {/* Three.js particle canvas */}
      <ParticleBackground canvasRef={canvasRef} />

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.14),transparent_30%)]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-dvh items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md" ref={cardRef} style={{ opacity: 0 }}>
          <GlassCard className="w-full p-4 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-lg font-black text-slate-950 shadow-emerald-soft sm:h-12 sm:w-12 sm:text-xl">
                  م
                </div>
                <p className="text-lg font-black text-white sm:text-xl">متریل</p>
              </div>
              <ThemeToggle />
            </div>

            {!hasConfirmedPhone ? (
              <form className="space-y-4 sm:space-y-5" onSubmit={handlePhoneStep}>
                <div>
                  <label className="text-base font-bold text-slate-200" htmlFor="phone-number">
                    شماره تلفن
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 focus-within:border-emerald-300/45">
                    <Phone className="h-5 w-5 shrink-0 text-emerald-300" />
                    <input
                      autoComplete="tel"
                      className="h-10 min-w-0 flex-1 bg-transparent text-left text-base font-bold tracking-wide text-white outline-none placeholder:text-slate-500"
                      dir="ltr"
                      id="phone-number"
                      inputMode="tel"
                      maxLength={20}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="09120000000"
                      value={phoneNumber}
                    />
                  </div>
                </div>

                {formError ? <p className="text-sm font-bold text-amber-200">{formError}</p> : null}

                <Button className="w-full text-base" disabled={!canContinue} type="submit">
                  ادامه
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </form>
            ) : (
              <form className="space-y-4 sm:space-y-5" onSubmit={handleDevLogin}>
                <div>
                  <label className="text-base font-bold text-slate-200" htmlFor="display-name">
                    نام نمایشی (اختیاری)
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 focus-within:border-violet-300/45">
                    <UserRound className="h-5 w-5 shrink-0 text-violet-300" />
                    <input
                      autoComplete="name"
                      className="h-10 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                      id="display-name"
                      maxLength={160}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="مثلاً: علی محمدی"
                      value={displayName}
                    />
                  </div>
                </div>

                {formError || error ? (
                  <p className="text-sm font-bold text-amber-200">
                    {formError ?? getErrorMessage(error)}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1 text-base" disabled={isLoading} type="submit">
                    <CheckCircle2 className="h-5 w-5" />
                    {isLoading ? "در حال ورود" : "ورود"}
                  </Button>
                  <Button
                    className="flex-1 text-base"
                    disabled={isLoading}
                    onClick={() => setHasConfirmedPhone(false)}
                    variant="secondary"
                  >
                    ویرایش شماره
                  </Button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
