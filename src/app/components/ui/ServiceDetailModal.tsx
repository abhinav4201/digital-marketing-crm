"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, JSX } from "react";
import { FaTimes } from "react-icons/fa";

interface Service {
  icon: JSX.Element;
  title: string;
  description: string;
  details: string;
  points: string[];
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const ServiceDetailModal = ({
  isOpen,
  onClose,
  service,
}: ServiceModalProps) => {
  if (!service) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-60' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <button
                  onClick={onClose}
                  className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
                >
                  <FaTimes size={20} />
                </button>
                <div className='flex items-center mb-4'>
                  <div className='text-cyan-500 mr-4'>{service.icon}</div>
                  <Dialog.Title
                    as='h3'
                    className='text-2xl font-bold leading-6 text-gray-900'
                  >
                    {service.title}
                  </Dialog.Title>
                </div>
                <div className='mt-4'>
                  <p className='text-md text-gray-600'>{service.details}</p>
                  <ul className='mt-4 space-y-2 list-disc list-inside'>
                    {service.points.map((point, index) => (
                      <li key={index} className='text-gray-600'>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ServiceDetailModal;
