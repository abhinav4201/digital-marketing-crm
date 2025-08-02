import Link from "next/link";

const Footer = () => {
  return (
    <footer className='bg-gray-900'>
      <div className='max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-center space-x-6'>
          <Link
            href='/privacy-policy'
            className='text-base text-gray-400 hover:text-white'
          >
            Privacy Policy
          </Link>
          <Link
            href='/terms-of-service'
            className='text-base text-gray-400 hover:text-white'
          >
            Terms of Service
          </Link>
        </div>
        <div className='mt-8 text-center text-base text-gray-400'>
          &copy; {new Date().getFullYear()} Royal Screen. All rights reserved.{" "}
          {/* CHANGED */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
