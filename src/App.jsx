import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import Auth from './components/Auth/Auth';
import AuctionForm from './components/AuctionForm/AuctionForm';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AuctionList from './components/AuctionList/AuctionList';
import SellerDashboard from './components/SellerDashboard/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard/BuyerDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSellerPanel, setShowSellerPanel] = useState(false);
  const [showBuyerPanel, setShowBuyerPanel] = useState(false);

  useEffect(() => {
    // Escuchar cambios en la sesión (login/logout)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuth(false);
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setShowAdminPanel(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUserProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-wrapper">
      <Navbar 
        user={session?.user} 
        userProfile={userProfile}
        onAuthClick={() => setShowAuth(true)} 
        onLogout={handleLogout}
        onAdminClick={() => {
          setShowAdminPanel(!showAdminPanel);
          setShowSellerPanel(false);
        }}
        onSellerClick={() => {
          setShowSellerPanel(!showSellerPanel);
          setShowAdminPanel(false);
          setShowBuyerPanel(false);
        }}
        onBuyerClick={() => {
          setShowBuyerPanel(!showBuyerPanel);
          setShowAdminPanel(false);
          setShowSellerPanel(false);
        }}
        onHomeClick={() => {
          setShowAdminPanel(false);
          setShowSellerPanel(false);
          setShowBuyerPanel(false);
        }}
      />
      
      <main>
        {showAuth ? (
          <Auth onAuthSuccess={() => setShowAuth(false)} />
        ) : showAdminPanel && userProfile?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            <Hero onPublishClick={() => {
              if (session) {
                setShowPublishForm(true);
              } else {
                alert('Debes iniciar sesión para publicar un producto.');
                setShowAuth(true);
              }
            }} />
            
            {showSellerPanel && session && (
              <SellerDashboard 
                user={session.user} 
                onClose={() => setShowSellerPanel(false)} 
              />
            )}

            {showBuyerPanel && session && (
              <BuyerDashboard 
                user={session.user} 
                onClose={() => setShowBuyerPanel(false)} 
              />
            )}
            
            {showPublishForm && session && (
              <AuctionForm 
                user={session.user} 
                onClose={() => setShowPublishForm(false)} 
                onSuccess={() => alert('¡Subasta enviada a revisión con éxito!')}
              />
            )}
            
            {!showAdminPanel && !showSellerPanel && !showBuyerPanel && (
              <AuctionList session={session} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
