const PrivacyPolicyPage = () => {
  return (
    <div className='bg-white py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-extrabold text-gray-900'>
          Privacy Policy
        </h1>
        <p className='mt-4 text-gray-500'>Last updated: August 01, 2025</p>

        <div className='mt-8 prose prose-lg text-gray-600'>
          <p>
            Your Company Name (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;) operates the [Your Website URL] website (the
            &quot;Service&quot;). This page informs you of our policies
            regarding the collection, use, and disclosure of personal data when
            you use our Service and the choices you have associated with that
            data.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            Information Collection and Use
          </h2>
          <p>
            We collect several different types of information for various
            purposes to provide and improve our Service to you. While using our
            Service, we may ask you to provide us with certain personally
            identifiable information that can be used to contact or identify you
            (&quot;Personal Data&quot;). This may include, but is not limited
            to: Email address, First name and last name, Phone number, and
            Company Name.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>Use of Data</h2>
          <p>
            We use the collected data for various purposes: to provide and
            maintain our Service, to notify you about changes to our Service, to
            provide customer support, and to gather analysis or valuable
            information so that we can improve our Service.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            Security of Data
          </h2>
          <p>
            The security of your data is important to us, but remember that no
            method of transmission over the Internet or method of electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your Personal Data, we cannot guarantee
            its absolute security.
          </p>

          {/* Add more sections as required by your legal needs */}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
