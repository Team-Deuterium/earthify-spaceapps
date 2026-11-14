import { Outlet, NavLink } from "react-router";

const SideBar = () => {
  return (
    <div className="flex h-screen">
      <nav className="w-50 shrink-0 bg-gray-900 text-white p-4 flex flex-col gap-2">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/predict">Predict</NavLink>
        <NavLink to="/compare">Compare</NavLink>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default SideBar;
