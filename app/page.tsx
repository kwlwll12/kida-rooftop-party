"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";

type Guest = {
  id: string;
  name: string;
  instagram: string | null;
  plus_one: boolean;
};

export default function Home() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [guestCount, setGuestCount] = useState(0);
  const [previewGuests, setPreviewGuests] = useState<Guest[]>([]);
  const [registered, setRegistered] = useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmedName, setConfirmedName] = useState("");
  const [confirmedGuestId, setConfirmedGuestId] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [dietary, setDietary] = useState("");
  const [plusOne, setPlusOne] = useState(false);

  useEffect(() => {
    setRegistered(localStorage.getItem("registered") === "true");

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const guest = params.get("guest");
    const nameFromUrl = params.get("name");

    if (success === "true") {
      setPaymentSuccess(true);
      setConfirmedName(nameFromUrl || "");
      setConfirmedGuestId(guest || "");

      localStorage.setItem("registered", "true");
      if (guest) localStorage.setItem("guestId", guest);

      if (guest) {
        supabase.from("guests").update({ payment_status: "paid" }).eq("id", guest);
      }
    }

    loadGuests();
  }, []);

  async function loadGuests() {
    const { data } = await supabase
      .from("guests")
      .select("id, name, instagram, plus_one")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: true });

    if (!data) return;

    const total = data.reduce((sum, guest) => sum + (guest.plus_one ? 2 : 1), 0);
    setGuestCount(total);
    setPreviewGuests(data.slice(0, 6));
  }

  async function handleRSVP() {
    if (!name || !email) {
      alert("Please enter your name and email.");
      return;
    }

    if (guestCount + (plusOne ? 2 : 1) > 100) {
      alert("Not enough spots available for this RSVP.");
      return;
    }

    setLoading(true);

    const { data: guest, error } = await supabase
  .from("guests")
  .insert({
    name,
    email,
    dietary,
    payment_status: "pending",
  })
  .select()
  .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    localStorage.setItem("guestId", guest.id);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestId: guest.id,
        email,
        name,
      }),
    });

    const checkout = await res.json();

    if (checkout.url) {
      window.location.href = checkout.url;
    } else {
      alert(checkout.error || "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#121212] p-8 text-center shadow-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-pink-300">
              Payment Confirmed
            </p>

            <h1 className="mt-5 text-4xl font-bold">You&apos;re on the list.</h1>

            <p className="mt-6 text-lg text-neutral-300">
              {confirmedName || "Your registration"} has been confirmed for
              <br />
              <span className="font-semibold text-white">KIDA Rooftop Party</span>.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Confirmation ID
              </p>
              <p className="mt-2 break-all font-mono text-sm text-neutral-300">
                {confirmedGuestId || "Confirmed"}
              </p>
            </div>

            <p className="mt-6 text-sm text-neutral-400">
              Screenshot this page or save it as PDF.
            </p>

            <button
              onClick={() => window.print()}
              className="mt-8 rounded-full bg-white px-8 py-4 font-semibold text-black transition hover:scale-105"
            >
              Print / Save as PDF
            </button>

            <button
              onClick={() => setPaymentSuccess(false)}
              className="mt-4 block w-full rounded-full border border-white/20 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Back to Event
            </button>
          </div>
        </div>
      )}

      <section className="relative z-10 grid min-h-screen grid-cols-1 gap-12 px-7 py-10 md:grid-cols-[1fr_0.95fr] md:px-16 lg:px-20">
        <div className="flex flex-col justify-center">
          <p className="mb-7 text-xs font-semibold uppercase tracking-[0.55em] text-pink-300 md:text-sm">
            Hosted by KSDA
          </p>

          <h1 className="max-w-4xl text-[4.6rem] font-black leading-[0.88] tracking-[-0.08em] md:text-[7.5rem] lg:text-[8.5rem]">
            KIDA Rooftop Party
          </h1>

          <div className="mt-10 space-y-3 text-xl text-neutral-300">
            <p>Friday, August 15</p>
            <p>7:00 PM</p>
            <p>Rooftop · New York City</p>
          </div>

          <p className="mt-12 max-w-2xl text-xl leading-relaxed text-neutral-300 md:text-2xl">
            A rooftop evening with music, drinks, city views, and good company.
          </p>

          <div className="mt-10 w-fit rounded-[2rem] border border-white/15 bg-white/[0.03] px-7 py-6">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
              Guest List
            </p>

            <p className="mt-3 text-3xl font-bold">
              {guestCount} / 100 Spots Filled
            </p>

            {registered ? (
              <div className="mt-6">
                <div className="flex -space-x-3">
                  {previewGuests.map((guest, index) => (
                    <div
                      key={guest.id}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white text-sm font-bold text-black"
                    >
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-1 text-sm text-neutral-300">
                  {previewGuests.map((guest) => (
                    <p key={guest.id}>
                      {guest.name}
                      {guest.plus_one ? " +1" : ""}
                    </p>
                  ))}
                </div>

                {guestCount > 6 && (
                  <p className="mt-3 text-sm text-neutral-500">
                    + {guestCount - 6} more
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm text-neutral-400">
                RSVP to unlock the full guest list.
              </p>
            )}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="mt-10 w-fit rounded-full bg-white px-10 py-5 text-lg font-bold text-black shadow-2xl transition hover:scale-105 hover:bg-neutral-200"
          >
            RSVP
          </button>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-[3.5rem] border border-white/15 bg-white/[0.02] shadow-2xl">
            <Image
              src="/hero.jpg"
              alt="KIDA Rooftop Party"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 rounded-[3.5rem] ring-1 ring-inset ring-white/10" />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 px-7 py-20 md:px-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-300">
              Vibe
            </p>
            <h2 className="mt-4 text-3xl font-bold">Rooftop</h2>
            <p className="mt-3 text-neutral-400">
              City views, music, and late-summer energy.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-300">
              Capacity
            </p>
            <h2 className="mt-4 text-3xl font-bold">100 Spots</h2>
            <p className="mt-3 text-neutral-400">
              RSVP early before the event reaches capacity.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-300">
              Ticket
            </p>
            <h2 className="mt-4 text-3xl font-bold">$50</h2>
            <p className="mt-3 text-neutral-400">
              Payment confirms your spot.
            </p>
          </div>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#121212] p-7 shadow-2xl">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-pink-300">
                  RSVP
                </p>
                <h2 className="mt-2 text-3xl font-bold">Save your spot</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Enter your info, then continue to payment.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-neutral-500"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-neutral-500"
              />

        

              <input
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="Dietary restrictions (optional)"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-neutral-500"
              />

              
              <button
                onClick={handleRSVP}
                disabled={loading}
                className="w-full rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:scale-[1.02] hover:bg-neutral-200 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Continue to Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}