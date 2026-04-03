import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="glass p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
        <p className="text-gray-400">Thanks for reaching out. I'll get back to you soon.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-xs font-light uppercase tracking-widest text-[#9CA3AF] mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-2.5 bg-white border border-[#D9D0C8] rounded-[4px] text-[#2D2D2D] placeholder-[#9CA3AF] text-sm font-light focus:outline-none focus:border-[#2D2D2D] transition-colors duration-200"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-light uppercase tracking-widest text-[#9CA3AF] mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2.5 bg-white border border-[#D9D0C8] rounded-[4px] text-[#2D2D2D] placeholder-[#9CA3AF] text-sm font-light focus:outline-none focus:border-[#2D2D2D] transition-colors duration-200"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-xs font-light uppercase tracking-widest text-[#9CA3AF] mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="w-full px-4 py-2.5 bg-white border border-[#D9D0C8] rounded-[4px] text-[#2D2D2D] placeholder-[#9CA3AF] text-sm font-light focus:outline-none focus:border-[#2D2D2D] transition-colors duration-200"
          placeholder="What's this about?"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-light uppercase tracking-widest text-[#9CA3AF] mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full px-4 py-2.5 bg-white border border-[#D9D0C8] rounded-[4px] text-[#2D2D2D] placeholder-[#9CA3AF] text-sm font-light focus:outline-none focus:border-[#2D2D2D] transition-colors duration-200 resize-none"
          placeholder="Your message..."
        />
      </div>

      {status === "error" && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#B91C1C] text-sm font-light">
          Something went wrong. Please try again or email me directly.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-2.5 bg-[#2D2D2D] hover:bg-[#404040] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-light tracking-wide rounded-[4px] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:ring-offset-2 flex items-center gap-2"
      >
        {status === "sending" && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
