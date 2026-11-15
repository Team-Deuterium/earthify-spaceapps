import React from "react";
import { Outlet, NavLink } from "react-router";
import { useClimate } from "../context/ClimateContext";
import EarthifyLogo from "../assets/EarthifyLogo.svg";

const navClass = ({ isActive }) =>
  `w-full text-left px-4 py-2 rounded-md font-medium transition-colors text-sm ${
    isActive
      ? "bg-blue-900 text-white"
      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
  }`;

const SideBar = () => {
  const [showSidebar, setShowSidebar] = React.useState(true);
  const [position, setPosition] = React.useState({ x: 16, y: 16 });
  const isDragging = React.useRef(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const { primaryPlace, secondaryPlace } = useClimate();

  const handlePointerDown = (e) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const maxX = window.innerWidth - 220;
    const maxY = window.innerHeight - 310;
    setPosition({
      x: Math.max(8, Math.min(e.clientX - dragOffset.current.x, maxX)),
      y: Math.max(8, Math.min(e.clientY - dragOffset.current.y, maxY)),
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="flex min-h-screen">
      <nav
        style={{ left: `${position.x}px`, top: `${position.y}px`, zIndex: 1000 }}
        className={`fixed w-52 h-fit bg-gray-900/95 backdrop-blur border border-gray-800 text-white px-3 pt-2 pb-3 rounded-xl shadow-lg flex-col justify-start gap-1.5 select-none ${
          showSidebar ? "flex" : "hidden"
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-grab active:cursor-grabbing text-xs text-gray-400 hover:text-white py-1 pr-4 flex items-center gap-1"
            title="Drag to move"
          >
            <span>⋮⋮</span>
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              Menu
            </span>
          </div>

          <button
            onClick={() => setShowSidebar(false)}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        <div className="flex items-center gap-2 px-1 py-1.5 mb-0.5 border-b border-gray-800">
          <img
            src={EarthifyLogo}
            alt="Earthify Logo"
            className="w-6 h-6 object-contain shrink-0"
          />
          <span className="text-base font-bold tracking-tight text-white">
            Earthify
          </span>
        </div>

        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        <NavLink to="/predict" className={navClass}>
          Predict
        </NavLink>
        <NavLink to="/compare" className={navClass}>
          Compare
        </NavLink>

        {(primaryPlace || secondaryPlace) && (
          <div className="mt-1.5 border-t border-gray-800 pt-2 text-[11px] text-gray-400 space-y-1">
            {primaryPlace && (
              <div className="truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5" />
                A: {primaryPlace.name}
              </div>
            )}
            {secondaryPlace && (
              <div className="truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
                B: {secondaryPlace.name}
              </div>
            )}
          </div>
        )}
      </nav>

      <main className="relative flex-1">
        <button
          onClick={() => setShowSidebar(true)}
          style={{ zIndex: 1000 }}
          className={`fixed top-5 left-5 bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-sm rounded-md shadow ${
            showSidebar ? "hidden" : "block"
          }`}
        >
          Open
        </button>
        <Outlet />
      </main>
    </div>
  );
};

export default SideBar;
