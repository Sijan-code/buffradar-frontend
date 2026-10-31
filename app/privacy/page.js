import LegalPage, { H2, P, UL, ContactMail } from '../LegalPage';

export const metadata = {
  title: 'Privacy Policy | BuffRadar',
  description: 'How BuffRadar handles your data when you download, convert and edit videos online.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <P>
        This policy explains what information BuffRadar (buffradar.com) collects when you use our video downloader,
        converter and editor, and how we use it. By using the site you agree to this policy.
      </P>

      <H2>Information we collect</H2>
      <UL
        items={[
          'Account information. Every visitor gets an anonymous account so we can count free credits. If you sign in with Google, we also receive your email address and basic profile details from Google.',
          'Download history. When you fetch a video, we save its title and link in your history so you can see it again. You can delete items, or the whole list, from the Download History panel in the menu.',
          'Usage records. To manage daily credits we keep records of which tool you used and when, together with an anonymous hash of the link. Visitors who are not signed in are also tracked by a hashed (not readable) form of their IP address, to prevent abuse.',
          'Referral data. If you invite a friend, we store your referral code and which accounts joined with it.',
          'Premium waiting list. If you join the waiting list, we store your email address and whether you agreed to receive updates.',
          'Technical data. Our hosting providers may log standard information such as IP address, browser type and the pages requested.',
        ]}
      />

      <H2>How we use it</H2>
      <UL
        items={[
          'To run the tools, show your history and keep your credit balance.',
          'To prevent abuse and keep the service stable for everyone.',
          'To understand which pages are used, so we can improve the site.',
          'To contact you about Premium only if you joined the waiting list and agreed.',
        ]}
      />

      <H2>Videos and files you process</H2>
      <P>
        When you paste a link, our server fetches the video to prepare your download, conversion or edit. When you upload a
        file, it is sent to our server for processing. We do not keep your files: the temporary copies are deleted from our
        server after the result is delivered or when processing fails. We do not publish or share your videos.
      </P>

      <H2>AI editing</H2>
      <P>
        If you use Text to edit, the text you type, together with the clip length and resolution, is sent to our AI provider
        (Groq) to turn it into editing settings. Your video itself is not sent to the AI provider. Please do not enter
        personal or confidential information in your prompts.
      </P>

      <H2>Service providers</H2>
      <P>
        We rely on trusted providers to run the site: Vercel (website hosting and page-view analytics), Render (video
        processing), Supabase (accounts and database), Google (optional sign-in) and Groq (AI). They process data only to
        provide their service to us. Your information may therefore be handled in countries other than your own.
      </P>

      <H2>Cookies, browser storage and advertising</H2>
      <P>
        We use your browser’s storage to keep you signed in and remember things like an invitation code. Our site may show
        advertisements from third-party advertising partners. These partners may use cookies or similar technologies to
        show ads and measure how they perform. We do not control their cookies. You can block or delete cookies in your
        browser settings, but some features may stop working.
      </P>

      <H2>How long we keep data</H2>
      <UL
        items={[
          'Download history stays until you delete it.',
          'Usage records used for credits are kept for a short time (a few days) and then removed.',
          'Account, referral and waiting-list information stays until you ask us to delete it.',
        ]}
      />

      <H2>Your choices</H2>
      <P>
        You can delete your download history yourself at any time. To ask us to delete your account data or to be removed
        from the waiting list, contact <ContactMail />.
      </P>

      <H2>Children</H2>
      <P>BuffRadar is not directed at children under 13, and we do not knowingly collect information from them.</P>

      <H2>Changes to this policy</H2>
      <P>
        We may update this policy from time to time. The date at the top shows when it was last changed. Questions? Contact{' '}
        <ContactMail />.
      </P>
    </LegalPage>
  );
}