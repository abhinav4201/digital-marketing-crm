import { Mail, MapPin, Phone } from "lucide-react";

const TermsOfServicePage = () => {
  return (
    <div className='bg-white py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-extrabold text-gray-900'>
          Terms of Service
        </h1>
        <p className='mt-4 text-gray-500'>Effective date: August 5, 2025</p>

        <div className='mt-8 prose prose-lg text-gray-600'>
          <h2>1. Agreement to Terms</h2>
          <p>
            These Terms of Service constitute a legally binding agreement made
            between you, whether personally or on behalf of an entity (“you”)
            and Royal Screen (“we,” “us,” or “our”), concerning your access to
            and use of the Royal Screen website as well as any other media form,
            media channel, mobile website or mobile application related, linked,
            or otherwise connected thereto (collectively, the “Site”).
          </p>
          <p>
            You agree that by accessing the Site, you have read, understood, and
            agreed to be bound by all of these Terms of Service. If you do not
            agree with all of these terms, then you are expressly prohibited
            from using the site and you must discontinue use immediately.
          </p>

          <h2>2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and
            all source code, databases, functionality, software, website
            designs, audio, video, text, photographs, and graphics on the Site
            (collectively, the “Content”) and the trademarks, service marks, and
            logos contained therein (the “Marks”) are owned or controlled by us
            or licensed to us, and are protected by copyright and trademark
            laws.
          </p>

          <h2>3. User Representations</h2>
          <p>
            By using the Site, you represent and warrant that: (1) all
            registration information you submit will be true, accurate, current,
            and complete; (2) you will maintain the accuracy of such information
            and promptly update such registration information as necessary; (3)
            you have the legal capacity and you agree to comply with these Terms
            of Service; (4) you will not use the Site for any illegal or
            unauthorized purpose; and (5) your use of the Site will not violate
            any applicable law or regulation.
          </p>

          <h2>4. User Registration</h2>
          <p>
            You may be required to register with the Site. You agree to keep
            your password confidential and will be responsible for all use of
            your account and password. We reserve the right to remove, reclaim,
            or change a username you select if we determine, in our sole
            discretion, that such username is inappropriate, obscene, or
            otherwise objectionable.
          </p>

          <h2>5. Prohibited Activities</h2>
          <p>
            You may not access or use the Site for any purpose other than that
            for which we make the Site available. The Site may not be used in
            connection with any commercial endeavors except those that are
            specifically endorsed or approved by us.
          </p>

          <h2>6. Submissions</h2>
          <p>
            You acknowledge and agree that any questions, comments, suggestions,
            ideas, feedback, or other information regarding the Site
            (&quot;Submissions&quot;) provided by you to us are non-confidential
            and shall become our sole property.
          </p>

          <h2>7. Site Management</h2>
          <p>
            We reserve the right, but not the obligation, to: (1) monitor the
            Site for violations of these Terms of Service; (2) take appropriate
            legal action against anyone who, in our sole discretion, violates
            the law or these Terms of Service; (3) in our sole discretion and
            without limitation, refuse, restrict access to, limit the
            availability of, or disable any of your Contributions or any portion
            thereof.
          </p>

          <h2>8. Term and Termination</h2>
          <p>
            These Terms of Service shall remain in full force and effect while
            you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE
            TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION
            AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE
            (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY
            REASON OR FOR NO REASON.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms of Service and your use of the Site are governed by and
            construed in accordance with the laws of India, and the courts of
            Patna, Bihar shall have exclusive jurisdiction to resolve any
            disputes.
          </p>

          <h2>10. Disclaimer</h2>
          <p>
            THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE
            THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE
            RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL
            WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR
            USE THEREOF.
          </p>

          <h2>11. Limitations of Liability</h2>
          <p>
            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE
            TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL,
            EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST
            PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM
            YOUR USE OF THE SITE, EVEN IF WE HAVE BEEN ADVISED OF THE
            POSSIBILITY OF SUCH DAMAGES.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold us harmless, including our
            subsidiaries, affiliates, and all of our respective officers,
            agents, partners, and employees, from and against any loss, damage,
            liability, claim, or demand, including reasonable attorneys’ fees
            and expenses, made by any third party due to or arising out of your
            use of the Site.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            In order to resolve a complaint regarding the Site or to receive
            further information regarding use of the Site, please contact us at:
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

export default TermsOfServicePage;
