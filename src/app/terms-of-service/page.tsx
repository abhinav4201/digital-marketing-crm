const TermsOfServicePage = () => {
  return (
    <div className='bg-white py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-extrabold text-gray-900'>
          Terms of Service
        </h1>
        <p className='mt-4 text-gray-500'>Effective date: August 01, 2025</p>

        <div className='mt-8 prose prose-lg text-gray-600'>
          <p>
            Please read these Terms of Service (&quot;Terms&quot;, &quot;Terms
            of Service&quot;) carefully before using the [Your Website URL]
            website (the &quot;Service&quot;) operated by Your Company Name
            (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).
          </p>
          <p>
            Your access to and use of the Service is conditioned on your
            acceptance of and compliance with these Terms. These Terms apply to
            all visitors, users, and others who access or use the Service.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>Accounts</h2>
          <p>
            When you create an account with us, you must provide us with
            information that is accurate, complete, and current at all times.
            Failure to do so constitutes a breach of the Terms, which may result
            in immediate termination of your account on our Service.
          </p>

          {/* Add more sections like "Intellectual Property", "Termination", "Governing Law", etc. */}
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
