export default function SidebarIcon({ icon, active, label }) {
  return (
    <div className="relative group flex items-center justify-center">
      {/* Icon Bubble */}
      <div className="flex items-center justify-center rounded-full bg-white p-[3px]">
        <div className="rounded-full bg-[#b8cbf4]">
          <div
            className={`p-3 rounded-full transition-all duration-200 font-bold text-black 
              ${active ? 'bg-white shadow-md' : 'hover:bg-white'} 
              cursor-pointer`}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Tooltip on right */}
      <span className="z-50 absolute left-full ml-3 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-white text-gray-600 text-md px-3 py-1 rounded-2xl shadow-lg whitespace-nowrap font-semibold">
        {label}
      </span>
    </div>
  );
}
