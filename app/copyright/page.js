import Link from 'next/link';
import LegalPage, { H2, P, UL, ContactMail } from '../LegalPage';

export const metadata = {
  title: 'Copyright & DMCA | BuffRadar',
  description: 'How to report a copyright concern to BuffRadar.',
  alternates: { canonical: '/copyright' },
};

export default function CopyrightPage() {
  return (
    <LegalPage title="Copyright & DMCA">
      <P>
        BuffRadar respects the rights of creators. We do not host, store or publish videos: the tools fetch a link you
        provide or process a file you upload, deliver the result to you, and then delete the temporary copy. The original
        content stays on the platform where it was published.
      </P>

      <H2>If you are a rights holder</H2>
      <P>
        Removing a video from YouTube, Facebook, TikTok or any other platform has to be done with that platform. If you
        believe our service is being used in a way that infringes your copyright, send us a notice and we will review it.
        Depending on the case, we may block the reported link from our service.
      </P>

      <H2>What to include in your notice</H2>
      <UL
        items={[
          'A description of the copyrighted work you say is infringed.',
          'The link (URL) that you want us to block.',
          'Your name, email address and a way to contact you.',
          'A statement that you believe in good faith that the use is not authorized by the rights holder, its agent or the law.',
          'A statement that the information in your notice is accurate and that you are the rights holder or authorized to act for them.',
          'Your signature (typed full name is fine).',
        ]}
      />
      <P>
        Send your notice to <ContactMail /> with the subject “Copyright notice”. Please do not send false or abusive
        notices.
      </P>

      <H2>If you think a block was a mistake</H2>
      <P>
        Contact us with the link and a short explanation. We will look at it and reply. Repeat or serious abuse of the
        service may lead to a person’s access being suspended.
      </P>

      <H2>For users</H2>
      <P>
        You are responsible for the content you download or convert. Use BuffRadar only with content you own or have
        permission to use. See our <Link href="/terms" className="text-emerald-400 underline underline-offset-2">Terms of Service</Link>{' '}
        and <Link href="/privacy" className="text-emerald-400 underline underline-offset-2">Privacy Policy</Link>.
      </P>
    </LegalPage>
  );
}