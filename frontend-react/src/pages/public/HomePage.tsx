import React, { useState } from 'react';
import type { NeedType } from '../../types';
import { PublicHeader } from './components/PublicHeader';
import { HeroSection } from './components/HeroSection';
import { TrustRibbon } from './components/TrustRibbon';
import { IntroSection } from './components/IntroSection';
import { ValueSection } from './components/ValueSection';
import { WorkGallerySection } from './components/WorkGallerySection';
import { ServicesSection } from './components/ServicesSection';
import { MethodSection } from './components/MethodSection';
import { PortfolioSection } from './components/PortfolioSection';
import { CaseStudySection } from './components/CaseStudySection';
import { WhereSection } from './components/WhereSection';
import { QuoteWizard } from './components/quote/QuoteWizard';
import { FaqSection } from './components/FaqSection';
import { FunnelBanner } from './components/FunnelBanner';
import { PublicFooter } from './components/PublicFooter';
import { MobileSalesBar } from './components/MobileSalesBar';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { ChatBotWidget } from './components/ChatBotWidget';
import { LightboxModal } from './components/LightboxModal';
import { TrackingModal } from './components/TrackingModal';

export const HomePage: React.FC = () => {
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    src: string;
    caption: string;
  }>({
    isOpen: false,
    src: '',
    caption: '',
  });

  const [wizardSpace, setWizardSpace] = useState<NeedType>('HOTEL');
  const [wizardServiceCode, setWizardServiceCode] = useState<string | undefined>(undefined);

  const handleOpenLightbox = (src: string, caption: string) => {
    setLightbox({
      isOpen: true,
      src,
      caption,
    });
  };

  const handleCloseLightbox = () => {
    setLightbox({
      isOpen: false,
      src: '',
      caption: '',
    });
  };

  const handleSelectServiceFromPreview = (serviceCode: string) => {
    setWizardServiceCode(serviceCode);
    const quoteEl = document.getElementById('cotizar');
    if (quoteEl) {
      quoteEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectSpaceFromBot = (space: NeedType) => {
    setWizardSpace(space);
  };

  return (
    <div className="min-h-screen bg-white text-[var(--ink)] font-sans antialiased">
      {/* Skip link for accessibility */}
      <a
        href="#inicio"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#79bd43] text-white font-bold rounded-sm shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* Header institucional */}
      <PublicHeader onOpenTracking={() => setIsTrackingOpen(true)} />

      {/* Contenido principal */}
      <main id="mainContent">
        <HeroSection />
        <TrustRibbon />
        <IntroSection />
        <ValueSection />
        <WorkGallerySection onImageClick={handleOpenLightbox} />
        <ServicesSection onSelectService={handleSelectServiceFromPreview} />
        <MethodSection />
        <PortfolioSection onImageClick={handleOpenLightbox} />
        <CaseStudySection />
        <WhereSection />
        <FaqSection />
        <FunnelBanner />
        <QuoteWizard
          initialSpaceType={wizardSpace}
          initialServiceCode={wizardServiceCode}
        />
      </main>

      {/* Pie de página corporativo */}
      <PublicFooter />

      {/* Widgets flotantes y barras de interacción */}
      <MobileSalesBar />
      <WhatsAppFloat />
      <ChatBotWidget onSelectSpace={handleSelectSpaceFromBot} />

      {/* Modales */}
      <LightboxModal
        isOpen={lightbox.isOpen}
        src={lightbox.src}
        caption={lightbox.caption}
        onClose={handleCloseLightbox}
      />

      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
    </div>
  );
};

export default HomePage;

