import LegalPage, { H2, P, UL, ContactMail } from '../LegalPage';

export const metadata = {
  title: 'Terms of Service | BuffRadar',
  description: 'The rules for using BuffRadar to download, convert and edit videos online.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <P>
        These terms apply when you use BuffRadar (buffradar.com). By using the site you agree to them. If you do not agree,
        please do not use the service.
      </P>

      <H2>The service</H2>
      <P>
        BuffRadar is a set of online tools to download, convert and edit videos and audio. We do not host a library of
        videos. Files are processed temporarily to give you the result you asked for.
      </P>

      <H2>Your responsibility for content</H2>
      <P>
        You are responsible for what you download, convert, edit and share. Use the tools only with content that you own,
        that is in the public domain, or that you have permission to use. Content on other platforms is protected by
        copyright and by those platforms’ own terms, and downloading it may not be allowed in your country or by the
        platform. BuffRadar does not give you any right to content that belongs to someone else.
      </P>

      <H2>Acceptable use</H2>
      <UL
        items={[
          'Do not use the service for anything illegal, or to infringe the rights of others.',
          'Do not try to overload, attack or reverse-engineer the service, or to get around credit limits (for example with automated tools or fake accounts).',
          'Do not upload content you are not allowed to use, or content that is unlawful or harmful.',
          'Content protected by DRM and private or login-only content cannot be downloaded.',
        ]}
      />

      <H2>Credits and accounts</H2>
      <P>
        Each tool uses credits. Visitors receive free credits that renew over time, and signing in or inviting friends can
        earn more. We may change the amounts, the prices of tools and the ways to earn credits at any time. Paid plans, if
        we offer them, will have their own terms. We may limit or suspend access to protect the service.
      </P>

      <H2>Other platforms</H2>
      <P>
        BuffRadar is not affiliated with, endorsed by or sponsored by YouTube, Facebook, Instagram, TikTok, X or any other
        platform. Their names and logos belong to their owners and are used only to describe what the tool works with.
      </P>

      <H2>Advertising and third-party links</H2>
      <P>
        The site may show advertisements and links to third-party sites. We are not responsible for their content or
        practices.
      </P>

      <H2>No guarantees</H2>
      <P>
        The service is provided “as is” and “as available”. Downloads and edits depend on third-party platforms and can stop
        working without notice. We do not promise that the service will be uninterrupted or error-free, or that results
        will suit a particular purpose. Keep a copy of your original files.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        To the fullest extent allowed by law, BuffRadar and its operators are not liable for any indirect or consequential
        loss, or for loss of data or profit, arising from your use of the service or from content you choose to download or
        edit.
      </P>

      <H2>Suspension and changes</H2>
      <P>
        We may suspend or stop access for anyone who breaks these terms. We may update the terms from time to time; using the
        site after a change means you accept the new version. Copyright concerns can be reported through our Copyright &amp;
        DMCA page. Other questions: <ContactMail />.
      </P>
    </LegalPage>
  );
}