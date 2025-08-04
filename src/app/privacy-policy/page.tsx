import { Mail, MapPin, Phone } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <div className='bg-white py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-extrabold text-gray-900'>
          Privacy Policy for Royal Screen
        </h1>
        <p className='mt-4 text-gray-500'>Last updated: August 5, 2025</p>

        <div className='mt-8 prose prose-lg text-gray-600'>
          <p>
            Welcome to Royal Screen (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;). We are committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website. Please read this
            privacy policy carefully. If you do not agree with the terms of this
            privacy policy, please do not access the site.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            1. Information We Collect
          </h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect on the Site includes:
          </p>
          <h3>Personal Data</h3>
          <p>
            Personally identifiable information, such as your name, email
            address, and telephone number, and demographic information, such as
            your company, project type, and budget, that you voluntarily give to
            us when you fill out our contact form or when you choose to
            participate in various activities related to the Site.
          </p>
          <h3>Derivative Data</h3>
          <p>
            Information our servers automatically collect when you access the
            Site, such as your IP address, your browser type, your operating
            system, your access times, and the pages you have viewed directly
            before and after accessing the Site. We may also use third-party
            services such as Google Analytics to collect this information.
          </p>
          <h3>Financial Data</h3>
          <p>
            We do not collect or store financial information. All financial
            transactions are processed through our payment processor, Stripe,
            and you should review their privacy policy and contact them directly
            for responses to your questions.
          </p>
          <h3>Data from Social Networks</h3>
          <p>
            User information from social networking sites, such as Google,
            including your name, your social network username, location, gender,
            birth date, email address, profile picture, and public data for
            contacts, if you connect your account to such social networks.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            2. Use of Your Information
          </h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Site to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Email you regarding your account or order.</li>
            <li>
              Fulfill and manage projects, payments, and other transactions
              related to the Site.
            </li>
            <li>
              Generate a personal profile about you to make future visits to the
              Site more personalized.
            </li>
            <li>Increase the efficiency and operation of the Site.</li>
            <li>
              Monitor and analyze usage and trends to improve your experience
              with the Site.
            </li>
            <li>Notify you of updates to the Site.</li>
            <li>
              Offer new products, services, and/or recommendations to you.
            </li>
            <li>Perform other business activities as needed.</li>
            <li>
              Request feedback and contact you about your use of the Site.
            </li>
            <li>Resolve disputes and troubleshoot problems.</li>
            <li>Respond to product and customer service requests.</li>
            <li>Send you a newsletter.</li>
          </ul>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            3. Disclosure of Your Information
          </h2>
          <p>
            We may share information we have collected about you in certain
            situations. Your information may be disclosed as follows:
          </p>
          <h3>By Law or to Protect Rights</h3>
          <p>
            If we believe the release of information about you is necessary to
            respond to legal process, to investigate or remedy potential
            violations of our policies, or to protect the rights, property, and
            safety of others, we may share your information as permitted or
            required by any applicable law, rule, or regulation.
          </p>
          <h3>Third-Party Service Providers</h3>
          <p>
            We may share your information with third parties that perform
            services for us or on our behalf, including payment processing, data
            analysis, email delivery, hosting services, customer service, and
            marketing assistance.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            4. Tracking Technologies
          </h2>
          <h3>Cookies and Web Beacons</h3>
          <p>
            We may use cookies, web beacons, tracking pixels, and other tracking
            technologies on the Site to help customize the Site and improve your
            experience. When you access the Site, your personal information is
            not collected through the use of tracking technology. Most browsers
            are set to accept cookies by default. You can remove or reject
            cookies, but be aware that such action could affect the availability
            and functionality of the Site.
          </p>
          <h3>Website Analytics</h3>
          <p>
            We may also partner with selected third-party vendors, such as
            Google Analytics, to allow tracking technologies and remarketing
            services on the Site through the use of first-party cookies and
            third-party cookies, to, among other things, analyze and track
            users’ use of the Site, determine the popularity of certain content,
            and better understand online activity.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            5. Security of Your Information
          </h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken
            reasonable steps to secure the personal information you provide to
            us, please be aware that despite our efforts, no security measures
            are perfect or impenetrable, and no method of data transmission can
            be guaranteed against any interception or other type of misuse.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            6. Policy for Children
          </h2>
          <p>
            We do not knowingly solicit information from or market to children
            under the age of 13. If you become aware of any data we have
            collected from children under age 13, please contact us using the
            contact information provided below.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            7. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any
            changes.
          </p>

          <h2 className='mt-6 text-2xl font-bold text-gray-800'>
            8. Contact Us
          </h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <div className='mt-4 not-prose space-y-4'>
            <div className='flex items-start'>
              <MapPin className='flex-shrink-0 h-6 w-6 text-gray-500 mt-1' />
              <div className='ml-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Royal Screen
                </h3>
                <p className='text-gray-700'>
                  Text Book Colony, Keshari Nagar, Baba Chowk, Patna, Bihar -
                  800024
                </p>
              </div>
            </div>
            <div className='flex items-center'>
              <Mail className='flex-shrink-0 h-6 w-6 text-gray-500' />
              <a
                href='mailto:abhinav445.aa@gmail.com'
                className='ml-4 text-gray-700 hover:text-blue-600'
              >
                abhinav445.aa@gmail.com
              </a>
            </div>
            <div className='flex items-center'>
              <Phone className='flex-shrink-0 h-6 w-6 text-gray-500' />
              <a
                href='tel:+917061582311'
                className='ml-4 text-gray-700 hover:text-blue-600'
              >
                +91 70615 82311
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
