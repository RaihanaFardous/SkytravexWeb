// One place for everything that is specific to your business.
// Change a value here and it updates across the whole site.

export const site = {
  name: 'SkyTravex',
  tagline: 'The travel platform for agencies, consolidators and OTAs',
  description:
    'SkyTravex gives a travel business an admin back office, a B2B agent portal and a branded B2C site that share one booking engine, one wallet and one ledger.',

  // Public address of this website. The "Home" menu item links here.
  siteUrl: 'https://skytravex-web.vercel.app/',

  // Parent company shown in the footer and on the About page.
  company: 'Skylake Solutions',
  companyUrl: 'https://skylakesolutions-web.vercel.app/',

  // Main contact shown on the Contact page and in the footer.
  contactName: 'Ahmed Zamil',
  email: 'ahmedlutfulzamil@gmail.com',
  phone: '+880 1711-118094',
  phoneHref: 'tel:+8801711118094',

  // Digits only with country code. Powers every WhatsApp button.
  whatsapp: '8801711118094',

  // Demo and contact requests are emailed here.
  leadsEmail: 'skylakesolutionsplc@gmail.com',
  // FormSubmit's private ID for that inbox, so the address is not exposed
  // in the website's code. Leave empty to fall back to leadsEmail.
  formsubmitId: 'b52979d3b03d2d6f7f80216ad04bb66d',

  // Visitors go here after the demo form.
  demoUrl: 'https://aerotake.net/',
  demoName: 'Aerotake',

  // Optional. Leave a value empty to show "Quoted per launch" instead.
  pricing: {
    setup: '',
    monthly: '',
  },
};

export function whatsappLink(text = 'Hello, I would like to know more about SkyTravex.') {
  if (!site.whatsapp) return '';
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
