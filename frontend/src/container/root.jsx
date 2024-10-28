import { ConfigProvider } from "antd";
import { useSelector } from "react-redux";
import { Link, Outlet, useLocation } from "react-router-dom";
import { selectCurrentUser } from "../store/user/user.slice";
import { AiOutlinePlus } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import logo from '/pin-it-up-logo.png';
import logoLowRes from '/pin-it-up-logo-low-res.png';
import DesktopNavbar from "../components/desktop/desktop-navbar";
import { useMediaQuery } from "react-responsive";
import { useState } from "react";

const Root = () => {
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  const [lowResLoaded, setLowResLoaded] = useState(false); 
  const [highResLoaded, setHighResLoaded] = useState(false);

  const signPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';

  return (
    <ConfigProvider
      theme={{
        inherit: true,
        token: {

          colorPrimary: '#dc2626', // red-600
          // colorPrimary: '#9C4141', // red-600
          // colorPrimary: '#25DB97', // red-600

          defaultHoverColor: '#b91c1c', // red-700

          hoverBg: '#DBD925',
          hoverBorderColor: '#DBD925',

          colorLink: '',
          colorLinkActive: '#DBD925',
          colorLinkHover: '#DBD925',
        }
      }}
    >
        <div id='App' className='w-full h-full overflow-hidden'>

          <nav className="top-0 flex w-full flex-wrap items-center justify-between bg-white shadow-dark-mild shadow-lg shadow-zinc-500/10">

              <div className={isDesktop ? 'hidden md:flex w-full flex-wrap items-center justify-between px-4' : 'md:hidden flex w-full flex-wrap items-center justify-between px-3'}>
                { isDesktop ? <DesktopNavbar /> : (
                  <>
                    <Link className="mx-2 my-1 flex items-center relative h-10 w-10" to="/">
                       {/* Placeholder */}
                      {!lowResLoaded && !highResLoaded && (
                        <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center rounded-lg" />
                      )}

                      {/* Low-resolution logo */}
                      <img
                        src={logoLowRes}
                        className={`absolute inset-0 h-10 w-10 transition-opacity duration-500 ease-in-out ${lowResLoaded ? 'opacity-100' : 'opacity-0'}`}
                        alt="Low Res Logo"
                        onLoad={() => setLowResLoaded(true)}
                      />
                      
                      {/* High-resolution logo */}
                      <img
                        src={logo}
                        className={`absolute inset-0 h-10 w-10 transition-opacity duration-700 ease-in-out ${highResLoaded ? 'opacity-100' : 'opacity-0'}`}
                        alt="High Res Logo"
                        onLoad={() => setHighResLoaded(true)}
                      />
                    </Link>

                    {currentUser && (
                      <div className="flex gap-3">
                        <Link to="/create-pin">
                          <AiOutlinePlus size='1.25em' />
                        </Link>
                        <Link to="/settings/account">
                          <IoSettingsOutline size='1.25em' />
                        </Link>
                      </div>
                    )}
                  </>
                ) }
            </div>

          </nav>
    
          <main className={`h-full w-full overflow-y-scroll ${location.pathname === '/' && "pb-24"} ${signPage ? '' : 'md:pb-14 md:px-20 md:pt-2'}`}>
            <Outlet />
          </main>

          
        </div>

    </ConfigProvider>
  )
};

export default Root;