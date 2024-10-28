import { AiOutlineHome } from "react-icons/ai";
import { AiOutlineSearch } from "react-icons/ai";
import { AiOutlineUser } from "react-icons/ai";
import { useSelector } from "react-redux";
import { Link, NavLink, Outlet } from "react-router-dom";
import { selectCurrentUser } from "../../store/user/user.slice";
import BottomModal from "./bottom-modal";
import { useContext } from "react";
import { BottomModalContext } from "../../context/bottom-modal-provider";
import ConfirmDeleteModal from "../confirm-delete-modal";
import { ConfirmationModalContext } from "../../context/confirmation-modal-provider";

const Navbar = () => {
  const { modalInfo } = useContext(BottomModalContext);
  const { confirmationModalInfo } = useContext(ConfirmationModalContext);

  const currentUser = useSelector(selectCurrentUser);

  return (
      <>
        <Outlet />

        { confirmationModalInfo.isOpen && <ConfirmDeleteModal /> }

        { modalInfo.isOpen ? (
            <BottomModal />
        ) : (
          <>
            {/* Mobile Navbar */}
            <div className="md:hidden fixed bottom-0 w-full bg-white z-10">
              <div className="flex justify-around">
                <NavLink to="/" className="p-4">
                  <AiOutlineHome />
                </NavLink>
                <NavLink to="/explore" className="p-4">
                  <AiOutlineSearch />
                </NavLink>
                <NavLink to={`/profile/${currentUser.username}`} className="p-4">
                  <AiOutlineUser />
                </NavLink>
              </div>
            </div>
          
          </>
        ) }

      </>
    );
}

export default Navbar