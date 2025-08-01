"use client";
import { signInWithPopup, signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaGoogle, FaUserCircle } from "react-icons/fa";
import { auth, provider } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useModalStore } from "../../store/useModalStore";

const Navbar = () => {
  const { user, role } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openModal } = useModalStore();

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  const navLinks = [
    { href: "/#services", text: "Services" },
    { href: "/#portfolio", text: "Portfolio" },
    { href: "/blog", text: "Blog" },
  ];

  return (
    <nav className='bg-slate-900 text-white sticky top-0 z-40 shadow-md'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex-shrink-0'>
            <Link href='/' className='text-2xl font-bold text-cyan-400'>
              Agency.
            </Link>
          </div>
          <div className='hidden md:block'>
            <div className='ml-10 flex items-baseline space-x-4'>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className='hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  {link.text}
                </Link>
              ))}
              <button
                onClick={openModal}
                className='hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium'
              >
                Contact
              </button>
              {user && (
                <Link
                  href='/dashboard/tickets'
                  className='hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  My Tickets
                </Link>
              )}
              {user && (
                <Link
                  href={
                    role === "admin"
                      ? "/admin"
                      : (role === "sales_rep"
                      ? "/admin/pipeline"
                      : "/dashboard"
              )}
                  className='hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className='hidden md:flex items-center'>
            {user ? (
              <div className='flex items-center space-x-4'>
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt='user photo'
                    width={32}
                    height={32}
                    className='rounded-full'
                  />
                ) : (
                  <FaUserCircle className='h-8 w-8' />
                )}
                <button
                  onClick={handleSignOut}
                  className='bg-cyan-500 hover:bg-cyan-600 px-3 py-2 rounded-md text-sm font-medium'
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className='bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-md text-sm font-medium flex items-center'
              >
                <FaGoogle className='mr-2' /> Sign In
              </button>
            )}
          </div>
          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className='focus:outline-none'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d={
                    isMobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className='hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium'
              >
                {link.text}
              </Link>
            ))}
            <button
              onClick={() => {
                openModal();
                setMobileMenuOpen(false);
              }}
              className='w-full text-left hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium'
            >
              Contact
            </button>
            {user && (
              <Link
                href='/dashboard/tickets'
                className='hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium'
              >
                My Tickets
              </Link>
            )}
            {user && (
              <Link
                href={
                  role === "admin"
                    ? "/admin"
                    : (role === "sales_rep"
                    ? "/admin/pipeline"
                    : "/dashboard"
            )}
                onClick={() => setMobileMenuOpen(false)}
                className='hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium'
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
