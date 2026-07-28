import { type FormEvent, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole, Phone } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useLoginMutation } from "../features/auth/authApi";
import { sessionAuthenticated } from "../features/auth/authSlice";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { normalizeNumberInput } from "../shared/utils/numberText";

function getLoginErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = Number((error as { status?: unknown }).status);
    if (status === 401) {
      return "شماره تلفن یا رمز عبور نادرست است.";
    }
    if (status === 403) {
      return "اعتبارسنجی امنیتی ناموفق بود. دوباره تلاش کنید.";
    }
  }

  return getApiErrorMessage(error, "خطا در ورود. دوباره تلاش کنید.");
}

function ParticleBackground({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> }) {
  return <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={canvasRef} />;
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [login, { error, isLoading }] = useLoginMutation();
  const normalizedPhone = useMemo(() => normalizeNumberInput(phoneNumber), [phoneNumber]);
  const canSubmit = normalizedPhone.length >= 8 && normalizedPhone.length <= 20 && password.length > 0;
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/companies";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animFrame: number;
    let cleanup: (() => void) | undefined;

    import("three")
      .then((THREE) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 3;

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
          particles.rotation.x = mouseY * 0.1;
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
      })
      .catch(() => {});

    return () => cleanup?.();
  }, []);

  useEffect(() => {
    let cleanupGsap: (() => void) | undefined;

    import("gsap")
      .then(({ gsap }) => {
        if (!cardRef.current) return;
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.1 }
        );
        cleanupGsap = () => gsap.killTweensOf(cardRef.current);
      })
      .catch(() => {});

    return () => cleanupGsap?.();
  }, []);

  if (status === "unknown") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#05050a] text-slate-100">
        <GlassCard className="max-w-sm p-6 text-center">
          <p className="text-lg font-black">در حال بررسی نشست</p>
        </GlassCard>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/companies" />;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!canSubmit) {
      setFormError("شماره تلفن و رمز عبور را کامل وارد کنید.");
      return;
    }

    try {
      const result = await login({
        phone_number: normalizedPhone,
        password
      }).unwrap();
      dispatch(sessionAuthenticated({ user: result.user, highlightCreateCompany: false }));
      navigate(from, { replace: true });
    } catch {
      // Error shown via RTK `error` / formError; never log credentials.
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-[#05050a] text-slate-100">
      <ParticleBackground canvasRef={canvasRef} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.14),transparent_30%)]" />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md" ref={cardRef} style={{ opacity: 0 }}>
          <GlassCard className="w-full p-4 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-lg font-black text-slate-950 shadow-emerald-soft sm:h-12 sm:w-12 sm:text-xl">
                  م
                </div>
                <div>
                  <p className="text-lg font-black text-white sm:text-xl">متریل</p>
                  <p className="text-xs text-slate-400">ورود با شماره و رمز عبور</p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="text-base font-bold text-slate-200" htmlFor="login-phone">
                  شماره تلفن
                </label>
                <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 focus-within:border-emerald-300/45">
                  <Phone className="h-5 w-5 shrink-0 text-emerald-300" />
                  <input
                    autoComplete="tel"
                    className="h-10 min-w-0 flex-1 bg-transparent text-left text-base font-bold tracking-wide text-white outline-none placeholder:text-slate-500"
                    dir="ltr"
                    id="login-phone"
                    inputMode="tel"
                    maxLength={20}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="09120000000"
                    value={phoneNumber}
                  />
                </div>
              </div>

              <div>
                <label className="text-base font-bold text-slate-200" htmlFor="login-password">
                  رمز عبور
                </label>
                <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 focus-within:border-violet-300/45">
                  <LockKeyhole className="h-5 w-5 shrink-0 text-violet-300" />
                  <input
                    autoComplete="current-password"
                    className="h-10 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                    dir="ltr"
                    id="login-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="رمز عبور"
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              {formError || error ? (
                <p className="text-sm font-bold text-amber-200">{formError ?? getLoginErrorMessage(error)}</p>
              ) : null}

              <Button className="w-full text-base" disabled={!canSubmit || isLoading} type="submit">
                <CheckCircle2 className="h-5 w-5" />
                {isLoading ? "در حال ورود" : "ورود"}
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-400">
              حساب ندارید؟{" "}
              <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/signup">
                ثبت‌نام
              </Link>
            </p>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
