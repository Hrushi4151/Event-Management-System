export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#eaf2fb] flex flex-col items-center font-sans py-16 px-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-2xl flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Contact Us</h1>
        <form className="flex flex-col gap-4 w-full">
          <input
            type="text"
            placeholder="Your Name"
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <textarea
            placeholder="Your Message"
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px]"
          />
          <button
            type="submit"
            className="rounded-full px-6 py-2 font-semibold bg-blue-400 text-white hover:bg-blue-500 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            Send Message
          </button>
        </form>
        <div className="text-sm text-gray-500 mt-4">
          Or email us at <a href="mailto:hello@eventflow.com" className="text-blue-500 hover:underline">hello@eventflow.com</a>
        </div>
      </div>
    </div>
  );
} 