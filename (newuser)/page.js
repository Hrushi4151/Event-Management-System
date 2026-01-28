import Image from "next/image";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";


function Button({ children, href, variant = "primary", ...props }) {
  const base =
    "rounded-full px-6 py-2 font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary:
      "bg-blue-400 text-white hover:bg-blue-500 focus:ring-blue-300",
    secondary:
      "bg-white text-blue-500 border border-blue-300 hover:bg-blue-50 focus:ring-blue-200",
    google:
      "bg-white text-gray-700 border border-gray-300 flex items-center gap-2 hover:bg-gray-50 focus:ring-gray-200",
  };
  if (href) {
    return (
      <Link href={href} className={`${base} ${variants[variant]}`} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}

const features = [
  { icon: "🔍", label: "Browse Events" },
  { icon: "📝", label: "Easy Registration" },
  { icon: "📩", label: "Email Confirmations" },
  { icon: "📱", label: "QR Code Tickets" },
  { icon: "📊", label: "Organizer Dashboard" },
  { icon: "🌐", label: "Online & Offline Support" },
];

const upcomingEvents = [
  {
    title: "Tech Symposium 2024",
    date: "2024-07-15",
    location: "City Hall, NY",
    poster: "/file.svg",
    type: "Tech",
    link: "#",
  },
  {
    title: "Art & Music Fest",
    date: "2024-08-01",
    location: "Central Park, NY",
    poster: "/window.svg",
    type: "Music",
    link: "#",
  },
  {
    title: "Startup Pitch Day",
    date: "2024-09-10",
    location: "Innovation Hub, SF",
    poster: "/globe.svg",
    type: "Business",
    link: "#",
  },
];

const testimonials = [
  {
    quote:
      "EventFlow made our college fest registration seamless and fun! Highly recommended.",
    name: "Priya S.",
    org: "Student Club, NYU",
  },
  {
    quote:
      "Managing attendees and sending QR tickets was a breeze. Love the dashboard!",
    name: "Rahul M.",
    org: "Tech Society, MIT",
  },
  {
    quote:
      "We doubled our event turnout after switching to EventFlow.",
    name: "Sara L.",
    org: "Startup Club, Stanford",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#eaf2fb] flex flex-col items-center font-sans">
      {/* Hero Section */}
      <section className="w-full max-w-5xl flex flex-col items-center text-center py-16 px-4">
        <div className="bg-white rounded-3xl shadow-lg p-10 w-full flex flex-col items-center gap-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-500 mb-2">Find & Host Events Effortlessly</h1>
          <p className="text-lg text-gray-600 mb-4">EventFlow helps you discover, register, or host events — all in one place.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/register">Sign Up</Button>
            <Button href="/login" variant="secondary">Login</Button>
            <Button variant="google">
             <FcGoogle className="text-2xl" /> Sign in with Google
            </Button>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 py-8 px-4">
        {/* Attendees Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block bg-blue-100 text-blue-500 rounded-full p-2 text-2xl">🧍</span>
            <h2 className="text-xl font-semibold text-blue-500">For Attendees</h2>
          </div>
          <ul className="text-gray-700 space-y-2 pl-2">
            <li>• Browse and register for events</li>
            <li>• Get reminders and QR tickets</li>
            <li>• View past and upcoming events</li>
          </ul>
        </div>
        {/* Organizers Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block bg-yellow-100 text-yellow-500 rounded-full p-2 text-2xl">🧑‍💼</span>
            <h2 className="text-xl font-semibold text-yellow-500">For Organizers</h2>
          </div>
          <ul className="text-gray-700 space-y-2 pl-2">
            <li>• Create, publish, and manage events</li>
            <li>• Track attendees and scan QR codes</li>
            <li>• View analytics & attendance reports</li>
          </ul>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="w-full max-w-5xl py-8 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Key Features</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full">
            {features.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 p-4">
                <span className="text-3xl">{f.icon}</span>
                <span className="font-semibold text-gray-700 text-center">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="w-full max-w-5xl py-8 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Upcoming Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {upcomingEvents.map((ev) => (
              <div key={ev.title} className="bg-blue-50 rounded-xl shadow p-4 flex flex-col gap-2">
                <Image src={ev.poster} alt={ev.title} width={60} height={60} className="rounded-lg mb-2" />
                <h3 className="font-bold text-blue-600 text-lg">{ev.title}</h3>
                <div className="text-gray-500 text-sm">{ev.date} • {ev.location}</div>
                <div className="text-xs text-blue-400 font-semibold">{ev.type}</div>
                <Link href={ev.link} className="text-blue-500 hover:underline text-sm mt-2">Learn More</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full max-w-5xl py-8 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-blue-500 mb-2">How It Works</h2>
          <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">
            <div className="flex flex-col items-center gap-2">
              <span className="bg-blue-100 text-blue-500 rounded-full p-3 mb-2 text-2xl">1</span>
              <span className="font-semibold text-gray-700">Sign Up</span>
            </div>
            <span className="text-3xl text-blue-300">→</span>
            <div className="flex flex-col items-center gap-2">
              <span className="bg-blue-100 text-blue-500 rounded-full p-3 mb-2 text-2xl">2</span>
              <span className="font-semibold text-gray-700">Browse or Create Events</span>
            </div>
            <span className="text-3xl text-blue-300">→</span>
            <div className="flex flex-col items-center gap-2">
              <span className="bg-blue-100 text-blue-500 rounded-full p-3 mb-2 text-2xl">3</span>
              <span className="font-semibold text-gray-700">Attend / Manage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Trusted By Section */}
      <section className="w-full max-w-5xl py-8 px-4 flex flex-col items-center">
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-8 w-full">
          <h2 className="text-xl font-bold text-blue-500 mb-2">Trusted by Clubs, Colleges & Startups</h2>
          <div className="flex gap-6 flex-wrap justify-center items-center mb-4">
            <span className="bg-gray-100 rounded-xl px-6 py-2 text-gray-400 text-sm">College Logo</span>
            <span className="bg-gray-100 rounded-xl px-6 py-2 text-gray-400 text-sm">Club Logo</span>
            <span className="bg-gray-100 rounded-xl px-6 py-2 text-gray-400 text-sm">Startup Logo</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-blue-50 rounded-xl p-4 shadow flex flex-col gap-2 items-center">
                <span className="text-gray-600 italic text-center">“{t.quote}”</span>
                <span className="font-semibold text-blue-500 mt-2">{t.name}</span>
                <span className="text-xs text-gray-400">{t.org}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-5xl py-12 px-4 flex flex-col items-center">
        <div className="bg-blue-400 rounded-3xl shadow-lg p-10 w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to experience effortless event management?</h2>
          <Button href="/register" variant="secondary">Get Started for Free</Button>
        </div>
      </section>
    </div>
  );
}
