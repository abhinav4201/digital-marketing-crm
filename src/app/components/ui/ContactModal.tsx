/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// File: app/components/ui/ContactModal.tsx

"use client";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation"; // Import the router
import { Fragment, useCallback, useEffect, useState } from "react";
import { FaGoogle, FaTimes, FaWhatsapp } from "react-icons/fa";
import { auth, provider } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useModalStore } from "../../store/useModalStore";
import SuccessMessage from "./SuccessMessage";

// --- COMPONENT DEFINITIONS MOVED OUTSIDE ---
const NotLoggedInView = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className='text-center p-8'>
    <h3 className='text-2xl font-bold text-white mb-4'>Please Sign In</h3>
    <p className='text-gray-400 mb-6'>
      You need to be signed in to send a request.
    </p>
    <button
      onClick={onSignIn}
      className='w-full bg-cyan-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-cyan-700 flex items-center justify-center transition-colors'
    >
      <FaGoogle className='mr-3' /> Sign in with Google
    </button>
  </div>
);

const ContactFormView = ({
  formData,
  error,
  isOtpSent,
  isVerified,
  submitting,
  otp,
  setOtp,
  countryCode,
  setCountryCode,
  resendCooldown,
  handleChange,
  handleSendOtp,
  handleVerifyOtp,
  handleSubmit,
}: any) => {
  const countryCodes = [
    { name: "IN", code: "+91" },
    { name: "US", code: "+1" },
    { name: "GB", code: "+44" },
    { name: "AU", code: "+61" },
  ];

  return (
    <form onSubmit={handleSubmit} className='space-y-4 text-white'>
      {error && (
        <p className='text-white text-center text-sm p-2 bg-red-900 rounded-md'>
          {error}
        </p>
      )}
      <div>
        <input
          type='text'
          name='name'
          required
          value={formData.name}
          onChange={handleChange}
          className='block w-full shadow-sm py-3 px-4 placeholder-gray-400 bg-gray-900 border-gray-700 rounded-md focus:ring-cyan-500 focus:border-cyan-500'
          placeholder='Full name'
        />
      </div>
      <div>
        <input
          id='email'
          name='email'
          type='email'
          required
          value={formData.email}
          onChange={handleChange}
          className='block w-full shadow-sm py-3 px-4 placeholder-gray-400 bg-gray-900 border-gray-700 rounded-md focus:ring-cyan-500 focus:border-cyan-500'
          placeholder='Email address'
        />
      </div>
      <div>
        <div className='flex rounded-md shadow-sm'>
          <select
            name='countryCode'
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={isOtpSent}
            className='block w-24 rounded-none text-white rounded-l-md bg-gray-900 border-gray-700 px-3 py-3 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-700'
          >
            {countryCodes.map((c) => (
              <option key={c.name} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <input
            type='tel'
            name='phone'
            required
            value={formData.phone}
            onChange={handleChange}
            disabled={isOtpSent}
            maxLength={10}
            pattern='\d{10}'
            title='Please enter a 10-digit phone number'
            className='flex-1 block w-full min-w-0 bg-gray-900 border-gray-700 px-3 py-3 placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-700'
            placeholder='10-digit WhatsApp Number'
          />
          <button
            type='button'
            onClick={() => handleSendOtp(formData.phone)}
            disabled={isOtpSent && resendCooldown > 0}
            className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 transition-colors'
          >
            <FaWhatsapp className='h-5 w-5 md:mr-2' />
            <span className='hidden md:inline'>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send OTP"}
            </span>
          </button>
        </div>
      </div>
      {isOtpSent && !isVerified && (
        <div>
          <div className='flex rounded-md shadow-sm'>
            <input
              type='text'
              name='otp'
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className='flex-1 block w-full min-w-0 rounded-none rounded-l-md bg-gray-900 border-gray-700 px-3 py-3 placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
              placeholder='Enter OTP'
            />
            <button
              type='button'
              onClick={handleVerifyOtp}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-cyan-600 hover:bg-cyan-700 transition-colors'
            >
              Verify
            </button>
          </div>
        </div>
      )}
      <div>
        <textarea
          id='message'
          name='message'
          rows={4}
          required
          value={formData.message}
          onChange={handleChange}
          className='block w-full shadow-sm py-3 px-4 placeholder-gray-400 bg-gray-900 border-gray-700 rounded-md focus:ring-cyan-500 focus:border-cyan-500'
          placeholder='Your Message'
        ></textarea>
      </div>
      <div className='mt-6'>
        <button
          type='submit'
          disabled={submitting || !isVerified}
          className='w-full inline-flex justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors'
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
};

const ContactModal = () => {
  const { isOpen, closeModal } = useModalStore();
  const { user } = useAuth();
  const router = useRouter(); // Initialize the router

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [countryCode, setCountryCode] = useState("+91");
  const [resendCooldown, setResendCooldown] = useState(0);

  const resetForm = useCallback(
    (shouldCloseModal = true) => {
      setFormData({ name: "", email: "", phone: "", message: "" });
      setError("");
      setSubmissionComplete(false);
      setSubmitting(false);
      setOtp("");
      setGeneratedOtp("");
      setIsOtpSent(false);
      setIsVerified(false);
      setCountryCode("+91");
      setResendCooldown(0);
      if (shouldCloseModal) {
        closeModal();
      }
    },
    [closeModal]
  );

  useEffect(() => {
    if (user && isOpen) {
      resetForm(false);
    }
  }, [user, isOpen, resetForm]);

  // CHANGED: This effect now handles both auto-closing and redirecting
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submissionComplete) {
      timer = setTimeout(() => {
        resetForm(true); // Close the modal
        router.push("/dashboard"); // Redirect to dashboard
      }, 3000); // Shortened to 3 seconds for a better UX
    }
    return () => clearTimeout(timer);
  }, [submissionComplete, resetForm, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setError("Failed to sign in. Please try again.");
    }
  };

  const handleSendOtp = useCallback(
    (phoneNumber: string) => {
      setError("");
      if (!/^\d{10}$/.test(phoneNumber)) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const whatsappUrl = `https://wa.me/${fullPhoneNumber.replace(
        /\+/g,
        ""
      )}?text=Your%20OTP%20is%3A%20${newOtp}`;
      window.open(whatsappUrl, "_blank");
      setIsOtpSent(true);
      setResendCooldown(30);
    },
    [countryCode]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone" && /^\d{10}$/.test(value) && !isOtpSent) {
      handleSendOtp(value);
    }
  };

  const handleVerifyOtp = () => {
    setError("");
    if (otp === generatedOtp) {
      setIsVerified(true);
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isVerified) {
      setError("Please verify your phone number using OTP.");
      return;
    }

    if (!user) {
      setError("An unexpected error occurred. Please try signing in again.");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const submissionData = {
        ...formData,
        phone: `${countryCode}${formData.phone}`,
      };

      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSubmissionComplete(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "An unknown error occurred.");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-50'
        onClose={() => resetForm(true)}
      >
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm' />
        </TransitionChild>
        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <DialogPanel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all'>
                <DialogTitle
                  as='h3'
                  className='text-lg font-medium leading-6 text-white flex justify-between items-center'
                >
                  <span>Contact Us</span>
                  <button
                    onClick={() => resetForm(true)}
                    className='text-gray-400 hover:text-white transition-colors'
                  >
                    <FaTimes />
                  </button>
                </DialogTitle>
                <div className='mt-4'>
                  {!user ? (
                    <NotLoggedInView onSignIn={handleSignIn} />
                  ) : submissionComplete ? (
                    <SuccessMessage />
                  ) : (
                    <ContactFormView
                      formData={formData}
                      error={error}
                      isOtpSent={isOtpSent}
                      isVerified={isVerified}
                      submitting={submitting}
                      otp={otp}
                      setOtp={setOtp}
                      countryCode={countryCode}
                      setCountryCode={setCountryCode}
                      resendCooldown={resendCooldown}
                      handleChange={handleChange}
                      handleSendOtp={handleSendOtp}
                      handleVerifyOtp={handleVerifyOtp}
                      handleSubmit={handleSubmit}
                    />
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ContactModal;
