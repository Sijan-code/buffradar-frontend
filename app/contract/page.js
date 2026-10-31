import LegalPage, { H2, P, ContactMail } from '../LegalPage';
import { SITE } from '../siteConfig';

export const metadata = {
  title: 'Contact | BuffRadar',
  description: 'Contact BuffRadar for support, feedback or copyright notices.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      {SITE.contactEmail ? (
        <>
          <P>
            For support, feedback or business questions, email us at <ContactMail />. We read every message and try to
            reply within a few days.
          </P>
          <H2>Copyright notices</H2>
          <P>Please follow the steps on our Copyright &amp; DMCA page and use the subject “Copyright notice”.</P>
          <H2>Helpful details</H2>
          <P>
            If a download or edit failed, tell us the page you used, the tool (downloader, converter or editor) and what
            you saw on the screen. Please never send passwords.
          </P>
        </>
      ) : (
        <P>Our contact details will be available here soon.</P>
      )}
    </LegalPage>
  );
}