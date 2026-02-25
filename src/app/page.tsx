import Link from "next/link";
import { BookOpen, Clock, Shield, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700 px-5 pt-12 pb-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-5">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Edlog
          </h1>
          <p className="text-brand-400 text-lg mt-2 font-medium">
            Digital Curriculum Logbook
          </p>
          <p className="text-white/70 mt-3 text-sm leading-relaxed max-w-xs mx-auto">
            Fill your logbook in under 60 seconds. Built for Cameroonian
            secondary schools.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 max-w-xs mx-auto">
            <Link
              href="/login"
              className="btn-primary text-center !shadow-xl"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-secondary text-center !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-slate-900 text-center mb-8">
          Why teachers love Edlog
        </h2>

        <div className="space-y-4">
          <div className="card p-4 flex gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Under 60 Seconds
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Fill a complete logbook entry faster than writing by hand.
                Pre-loaded curriculum data means fewer taps.
              </p>
            </div>
          </div>

          <div className="card p-4 flex gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Works on Any Phone
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Mobile-first design. Works on budget Android phones with slow
                connections. No app download needed.
              </p>
            </div>
          </div>

          <div className="card p-4 flex gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Admin Oversight
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                School admins track curriculum delivery in real-time. RPI
                boards verify compliance across schools.
              </p>
            </div>
          </div>

          <div className="card p-4 flex gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                GCE Curriculum Built-In
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                All GCE A-Level subjects, topics, and modules pre-loaded. Just
                select and submit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-8 text-center border-t border-slate-200">
        <p className="text-xs text-slate-400">
          Built by Darren Monyongo &amp; Brayan Lontchi
        </p>
        <p className="text-xs text-slate-400 mt-1">Cameroon</p>
      </div>
    </div>
  );
}
