import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DigitalCardModal } from './components/DigitalCardModal';
import { CertificateModal } from './components/CertificateModal';
import { AuthModal } from './components/AuthModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { LearningPage } from './pages/LearningPage';
import { RoadmapsPage } from './pages/RoadmapsPage';
import { ToolsPage } from './pages/ToolsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditPage } from './pages/AuditPage';
import { GalleryPage } from './pages/GalleryPage';
import { VerifyPage } from './pages/VerifyPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPortal } from './pages/AdminPortal';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { StakeholderSimulationBar } from './components/StakeholderSimulationBar';

import { Membership, Certificate } from './types';
import { api } from './services/api';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [tabParam, setTabParam] = useState<string | undefined>(undefined);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [viewCard, setViewCard] = useState<Membership | null>(null);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);

  const handleNavigate = (tab: string, param?: string) => {
    setCurrentTab(tab);
    setTabParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDigitalCard = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await api.memberships.getMyCards();
      if (res.cards && res.cards.length > 0) {
        setViewCard(res.cards[0]);
      } else {
        // Direct to clubs to enroll
        handleNavigate('clubs');
      }
    } catch (err) {
      console.error(err);
      handleNavigate('profile');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenDigitalCard={handleOpenDigitalCard}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'clubs' && (
          <ClubsPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'club-detail' && (
          <ClubDetailPage
            clubId={tabParam || 'club-1'}
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'events' && (
          <EventsPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'event-detail' && (
          <EventDetailPage
            eventId={tabParam || 'evt-1'}
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsPage
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'learning' && (
          <LearningPage
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'roadmaps' && (
          <RoadmapsPage
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'tools' && (
          <ToolsPage />
        )}

        {currentTab === 'certificates' && (
          <CertificatesPage
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsPage />
        )}

        {currentTab === 'audit' && (
          <AuditPage />
        )}

        {currentTab === 'gallery' && (
          <GalleryPage />
        )}

        {currentTab === 'announcements' && (
          <AnnouncementsPage />
        )}

        {currentTab === 'verify' && (
          <VerifyPage
            initialCode={tabParam}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'admin-portal' && (
          <AdminPortal />
        )}

        {(currentTab === 'profile' || currentTab === 'student-portal') && (
          <ProfilePage
            onNavigate={handleNavigate}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={handleNavigate}
      />

      {viewCard && (
        <DigitalCardModal
          card={viewCard}
          onClose={() => setViewCard(null)}
          onNavigateToVerify={(mId) => handleNavigate('verify', mId)}
        />
      )}

      {viewCert && (
        <CertificateModal
          certificate={viewCert}
          onClose={() => setViewCert(null)}
          onNavigateToVerify={(code) => handleNavigate('verify', code)}
        />
      )}

      {/* Interactive Stakeholder Role Switcher HUD */}
      <StakeholderSimulationBar />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
