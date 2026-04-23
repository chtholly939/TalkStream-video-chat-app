import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();

  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center w-full">

          {/* ✅ ALWAYS SHOW LOGO */}
          <Link to="/" className="flex items-center gap-2.5">
            <ShipWheelIcon className="size-7 sm:size-9 text-primary" />
            <span className="text-xl sm:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              TalkStream
            </span>
          </Link>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">

            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-base-content opacity-70" />
              </button>
            </Link>

            <ThemeSelector />

            {/* PROFILE */}
            <Link to="/profile" className="avatar">
              <div className="w-8 sm:w-9 rounded-full cursor-pointer overflow-hidden">
                <img
                  src={authUser?.profilePic || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>

            {/* LOGOUT */}
            <button
              className="btn btn-ghost btn-circle"
              onClick={logoutMutation}
            >
              <LogOutIcon className="h-5 w-5 sm:h-6 sm:w-6 text-base-content opacity-70" />
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;