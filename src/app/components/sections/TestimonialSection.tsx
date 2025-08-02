"use client";
import testimonials from "../../../data/testimonials.json";
import { Star } from "lucide-react";

// Helper component to render the stars
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className='flex items-center'>
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          size={20}
          className={
            index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }
        />
      ))}
    </div>
  );
};

const TestimonialSection = () => {
  // Duplicate the testimonials to create the content needed for a seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section id='testimonials' className='py-20 bg-gray-100 overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
            What Our Clients Say
          </h2>
          <p className='mt-4 text-lg text-gray-600'>
            We are proud to have partnered with amazing businesses.
          </p>
        </div>
      </div>

      {/* The 'group' class enables the pause-on-hover functionality */}
      <div className='mt-12 w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] group'>
        <ul className='flex items-center justify-center md:justify-start [&_li]:mx-4 animate-marquee'>
          {duplicatedTestimonials.map((testimonial, index) => (
            <li key={index}>
              <div className='bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full w-[350px]'>
                <div className='p-8 flex-grow'>
                  <div className='mb-4'>
                    <StarRating rating={testimonial.rating} />
                  </div>
                  <p className='text-gray-600 italic'>&quot;{testimonial.quote}&quot;</p>
                </div>
                <div className='bg-gray-50 p-6 border-t border-gray-200'>
                  <div className='flex items-center'>
                    <div
                      className='w-16 h-16 mr-4 rounded-full overflow-hidden flex-shrink-0'
                      dangerouslySetInnerHTML={{ __html: testimonial.svgImage }}
                    />
                    <div>
                      <p className='font-bold text-gray-900'>
                        {testimonial.name}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <p className='font-semibold text-gray-800'>
                      {testimonial.projectName}
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        testimonial.status === "Live Project"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {testimonial.status}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default TestimonialSection;
