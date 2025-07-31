import { FaCheckCircle } from "react-icons/fa";

const SuccessMessage = () => (
  <div className='text-center p-8 bg-gray-700 text-white rounded-lg shadow-lg flex flex-col items-center animate-fade-in'>
    <FaCheckCircle className='text-green-400 text-6xl mb-4' />
    <h3 className='text-2xl font-bold'>Thank You!</h3>
    <p className='mt-2 max-w-md'>
      Your request has been submitted successfully. We will review it and get
      back to you shortly.
    </p>
  </div>
);

export default SuccessMessage;
