export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#eaf2fb] flex flex-col items-center font-sans py-16 px-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-2xl flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">About EventFlow</h1>
        <p className="text-lg text-gray-600 mb-4 text-center">
          EventFlow is on a mission to make event management effortless for everyone. Whether you're an attendee looking for your next adventure or an organizer aiming to create memorable experiences, EventFlow brings it all together in one seamless platform.
        </p>
        <div className="w-full flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-blue-400">Our Story</h2>
          <p className="text-gray-700">
            Founded by a group of event enthusiasts and techies, EventFlow was born out of the need for a simple, modern, and reliable way to connect people through events. We believe in the power of community and the magic of shared experiences.
          </p>
          <h2 className="text-xl font-semibold text-blue-400 mt-4">Meet the Team</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li>Alex – Product & Community</li>
            <li>Jordan – Engineering</li>
            <li>Sam – Design & UX</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 