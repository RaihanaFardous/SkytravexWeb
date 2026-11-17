import PageHero from '@/components/PageHero';
import DemoAccess from '@/components/DemoAccess';
import Icon from '@/components/Icons';
import { site, whatsappLink } from '@/lib/site';

export const metadata = {
  title: 'Live demo',
  description: `Fill in a short form and explore ${site.demoName}, a live travel booking site running on SkyTravex.`,
};

const agenda = [
  ['Enter your details', 'Tell us about you and your business. It takes under a minute.'],
  ['Get your logins', `We create your ${site.demoName} account and show your logins on screen. A copy arrives by email.`],
  ['Start exploring', 'Sign in, search real routes and try the booking journey. Payments use test connections.'],
  ['See the back office', 'We follow up to walk you through the agent portal, admin panel and pricing rules.'],
];

export default function DemoPage() {
  const wa = whatsappLink();
  return (
    <>
      <PageHero
        label="Live demo"
        line="Your own demo account,"
        accent="ready in a minute."
        text={`Fill in the form and we create your account on ${site.demoName}, a live booking site running on SkyTravex. No meeting required.`}
      />

      <section className="section demo-section" aria-label="Demo request">
        <div className="wrap demo-grid">
          <aside className="demo-agenda" data-reveal="left">
            <h2>How the demo works</h2>
            <ol>
              {agenda.map(([name, text]) => (
                <li key={name}>
                  <strong>{name}</strong>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <div className="demo-showcase">
              <span className="demo-showcase-badge">Live on SkyTravex</span>
              <strong>{site.demoName}</strong>
              <span>Flights, hotels, tours and visa for travellers</span>
            </div>
            <p className="demo-contact">
              <Icon name="phone" size={18} />
              <a href={site.phoneHref}>{site.phone}</a>
            </p>
            <p className="demo-contact demo-contact-2">
              <Icon name="mail" size={18} />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
            {wa ? (
              <p className="demo-contact demo-contact-2">
                <Icon name="whatsapp" size={18} />
                <a href={wa} target="_blank" rel="noreferrer">
                  Chat on WhatsApp
                </a>
              </p>
            ) : null}
          </aside>
          <div className="demo-form-card" data-reveal="right">
            <DemoAccess />
          </div>
        </div>
      </section>
    </>
  );
}
