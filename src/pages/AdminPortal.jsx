import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const FALLBACK_CONFIG = {
  logoText: "RV creation",
  email: "rentals@rvcreation.com",
  phone: "+91 98765 43210",
  address: "402, Signature Plaza, Near Johri Bazaar, Jaipur, Rajasthan - 302001",
  instagram: "rv_creation_rentals",
  whatsapp: "+919876543210"
};

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Tab State: 'inventory' or 'settings'
  const [activeTab, setActiveTab] = useState('inventory');

  // Inventory & Config States
  const [lehengas, setLehengas] = useState([]);
  const [config, setConfig] = useState(FALLBACK_CONFIG);
  const [loading, setLoading] = useState(false);

  // Form States (Lehenga CRUD)
  const [editingItem, setEditingItem] = useState(null); // Item being edited, or null for creating new
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [lehengaForm, setLehengaForm] = useState({
    name: '',
    description: '',
    size: 'M',
    rentPrice: '',
    securityDeposit: '',
    discount: '0',
    rentTime: '3',
    leftTime: 'Available',
    image: '',
    video: ''
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({ ...FALLBACK_CONFIG });
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    // Clear any old insecure localStorage tokens immediately
    localStorage.removeItem('rv_admin_token');

    // Use sessionStorage (clears when tab/browser is closed)
    const token = sessionStorage.getItem('rv_admin_token');
    const expiry = sessionStorage.getItem('rv_admin_expiry');
    const now = Date.now();

    if (token === 'admin-token' && expiry && now < parseInt(expiry, 10)) {
      setIsLoggedIn(true);
      fetchAdminData();
    } else {
      // Clear expired or invalid session
      sessionStorage.removeItem('rv_admin_token');
      sessionStorage.removeItem('rv_admin_expiry');
    }
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const lehengaRes = await axios.get('/api/lehenga');
      setLehengas(lehengaRes.data);
    } catch (e) {
      const stored = localStorage.getItem('rv_lehengas');
      if (stored) setLehengas(JSON.parse(stored));
    }

    try {
      const configRes = await axios.get('/api/config');
      setConfig(configRes.data);
      setSettingsForm(configRes.data);
    } catch (e) {
      const stored = localStorage.getItem('rv_config');
      if (stored) {
        setConfig(JSON.parse(stored));
        setSettingsForm(JSON.parse(stored));
      } else {
        setConfig(FALLBACK_CONFIG);
        setSettingsForm(FALLBACK_CONFIG);
      }
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setLoginError('Password is required');
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    // Session duration: 30 minutes
    const SESSION_DURATION_MS = 30 * 60 * 1000;

    const grantSession = () => {
      const expiry = Date.now() + SESSION_DURATION_MS;
      sessionStorage.setItem('rv_admin_token', 'admin-token');
      sessionStorage.setItem('rv_admin_expiry', expiry.toString());
      setIsLoggedIn(true);
      fetchAdminData();
    };

    try {
      const response = await axios.post('/api/login', { password });
      if (response.data && response.data.token) {
        grantSession();
      }
    } catch (err) {
      if (err.response?.data?.error) {
        // Server is reachable but password is wrong
        setLoginError(err.response.data.error);
      } else {
        // Server offline: validate against hashed fallback
        // Hash: SHA-256 of the admin password (never store plain text here)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        // Compare against stored hash (change this hash when you change the password)
        const ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        if (hashHex === ADMIN_HASH) {
          grantSession();
        } else {
          setLoginError('Invalid password. Please try again.');
        }
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('rv_admin_token');
    sessionStorage.removeItem('rv_admin_expiry');
    setIsLoggedIn(false);
    setPassword('');
  };

  // Form Input handlers
  const handleLehengaFormChange = (e) => {
    setLehengaForm({
      ...lehengaForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSettingsFormChange = (e) => {
    setSettingsForm({
      ...settingsForm,
      [e.target.name]: e.target.value
    });
  };

  // Save Config Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    const token = localStorage.getItem('rv_admin_token');

    try {
      const res = await axios.put('/api/config', settingsForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(res.data);
      setSettingsSuccess(true);
    } catch (err) {
      // Offline fallback
      localStorage.setItem('rv_config', JSON.stringify(settingsForm));
      setConfig(settingsForm);
      setSettingsSuccess(true);
    } finally {
      setSettingsLoading(false);
      setTimeout(() => setSettingsSuccess(false), 3000);
    }
  };

  // Delete Lehenga
  const handleDeleteLehenga = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lehenga item?")) return;
    const token = localStorage.getItem('rv_admin_token');

    const updated = lehengas.filter(item => item.id !== id);
    setLehengas(updated);

    try {
      await axios.delete(`/api/lehenga/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      localStorage.setItem('rv_lehengas', JSON.stringify(updated));
    }
  };

  // Open creation form
  const openCreateForm = () => {
    setEditingItem(null);
    setLehengaForm({
      name: '',
      description: '',
      size: 'M',
      rentPrice: '',
      securityDeposit: '',
      discount: '0',
      rentTime: '3',
      leftTime: 'Available',
      image: '',
      video: ''
    });
    setFormError('');
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (item) => {
    setEditingItem(item);
    setLehengaForm({
      name: item.name,
      description: item.description,
      size: item.size,
      rentPrice: item.rentPrice.toString(),
      securityDeposit: item.securityDeposit ? item.securityDeposit.toString() : '',
      discount: item.discount.toString(),
      rentTime: item.rentTime.toString(),
      leftTime: item.leftTime,
      image: item.image,
      video: item.video || ''
    });
    setFormError('');
    setShowForm(true);
  };

  // Submit Lehenga Form
  const handleLehengaSubmit = async (e) => {
    e.preventDefault();
    if (!lehengaForm.name || !lehengaForm.rentPrice || !lehengaForm.image) {
      setFormError("Name, Rent Price, and Image URL are required.");
      return;
    }

    setFormSubmitLoading(true);
    setFormError('');
    const token = localStorage.getItem('rv_admin_token');

    const body = {
      ...lehengaForm,
      rentPrice: parseInt(lehengaForm.rentPrice, 10),
      securityDeposit: parseInt(lehengaForm.securityDeposit || '5000', 10),
      discount: parseInt(lehengaForm.discount || '0', 10),
      rentTime: parseInt(lehengaForm.rentTime || '3', 10),
    };

    try {
      if (editingItem) {
        // Edit Item
        const res = await axios.put(`/api/lehenga/${editingItem.id}`, body, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updated = lehengas.map(item => item.id === editingItem.id ? res.data : item);
        setLehengas(updated);
      } else {
        // Create Item
        const res = await axios.post('/api/lehenga', body, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLehengas([...lehengas, res.data]);
      }
      setShowForm(false);
    } catch (err) {
      // Offline fallback
      let updatedList = [...lehengas];
      if (editingItem) {
        const edited = { ...editingItem, ...body };
        updatedList = lehengas.map(item => item.id === editingItem.id ? edited : item);
      } else {
        const newItem = {
          id: Date.now(),
          ...body
        };
        updatedList.push(newItem);
      }
      setLehengas(updatedList);
      localStorage.setItem('rv_lehengas', JSON.stringify(updatedList));
      setShowForm(false);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  if (!isLoggedIn) {
    /* Premium Login View */
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #221c1a 0%, #3d141e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          color: 'white',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--gold-color)', letterSpacing: '1px', marginBottom: '10px' }}>
            RV CREATION
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '30px' }}>
            Admin Control Center
          </p>

          {loginError && (
            <div style={{ background: 'rgba(217, 83, 79, 0.15)', color: '#d9534f', fontSize: '14px', padding: '10px', borderRadius: '4px', border: '1px solid rgba(217, 83, 79, 0.3)', marginBottom: '20px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                Enter Secret Key
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--gold-color)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>

            <button 
              type="submit" 
              className="gold-btn" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              disabled={loginLoading}
            >
              {loginLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <Link to="/" style={{ display: 'inline-block', marginTop: '25px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '14px' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to Website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f3f0' }}>
      {/* Admin Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#221c1a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '30px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-color)', fontSize: '24px', letterSpacing: '1px' }}>
              {config.logoText}
            </h2>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Owner Portal
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => { setActiveTab('inventory'); setShowForm(false); }}
              style={{
                width: '100%',
                padding: '12px 15px',
                textAlign: 'left',
                background: activeTab === 'inventory' ? 'var(--primary-color)' : 'transparent',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background 0.3s'
              }}
            >
              <i className="fa-solid fa-shirt"></i> Lehenga Inventory
            </button>

            <button 
              onClick={() => { setActiveTab('settings'); setShowForm(false); }}
              style={{
                width: '100%',
                padding: '12px 15px',
                textAlign: 'left',
                background: activeTab === 'settings' ? 'var(--primary-color)' : 'transparent',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background 0.3s'
              }}
            >
              <i className="fa-solid fa-gears"></i> Website Settings
            </button>
          </nav>
        </div>

        <div>
          <Link to="/" className="luxury-btn-secondary" style={{ width: '100%', color: 'white', borderColor: 'rgba(255,255,255,0.3)', marginBottom: '15px', padding: '8px' }}>
            <i className="fa-solid fa-globe"></i> View Website
          </Link>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(217, 83, 79, 0.1)',
              border: '1px solid #d9534f',
              color: '#d9534f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main style={{ flex: 1, padding: '40px' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px' }}>
              {activeTab === 'inventory' ? 'Inventory Manager' : 'Settings Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
              Configure details, prices, availability, and contact options.
            </p>
          </div>

          {activeTab === 'inventory' && !showForm && (
            <button onClick={openCreateForm} className="luxury-btn">
              <i className="fa-solid fa-plus"></i> Add New Lehenga
            </button>
          )}
        </header>

        {/* Content Render */}
        {activeTab === 'inventory' ? (
          showForm ? (
            /* Creation & Editing Form */
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '30px', boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '22px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                {editingItem ? `Edit Lehenga: ${editingItem.name}` : 'Upload New Lehenga Outfit'}
              </h2>

              {formError && (
                <div style={{ color: '#d9534f', background: '#fdf2f2', border: '1px solid #d9534f', padding: '10px 15px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleLehengaSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Lehenga Name*</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="e.g. Royal Gold Banarasi Silk Lehenga"
                      value={lehengaForm.name}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Size</label>
                    <select 
                      name="size" 
                      value={lehengaForm.size}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description</label>
                  <textarea 
                    name="description" 
                    placeholder="Describe the fabric, detailing, accessories included, and fit guidelines..."
                    rows="4"
                    value={lehengaForm.description}
                    onChange={handleLehengaFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Rent Price / Day (₹)*</label>
                    <input 
                      type="number" 
                      name="rentPrice" 
                      placeholder="e.g. 3500"
                      value={lehengaForm.rentPrice}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Refundable Security Deposit (₹)</label>
                    <input 
                      type="number" 
                      name="securityDeposit" 
                      placeholder="e.g. 8000"
                      value={lehengaForm.securityDeposit}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Discount (%)</label>
                    <input 
                      type="number" 
                      name="discount" 
                      min="0"
                      max="99"
                      value={lehengaForm.discount}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Min Rent Duration (Days)</label>
                    <input 
                      type="number" 
                      name="rentTime" 
                      value={lehengaForm.rentTime}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Availability Status / Left Time</label>
                    <input 
                      type="text" 
                      name="leftTime" 
                      placeholder="e.g. Available, Rented - 3 days left"
                      value={lehengaForm.leftTime}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Lehenga Image URL*</label>
                    <input 
                      type="text" 
                      name="image" 
                      placeholder="Paste online image link (e.g. Unsplash)"
                      value={lehengaForm.image}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Lehenga Video URL (Optional)</label>
                    <input 
                      type="text" 
                      name="video" 
                      placeholder="Paste MP4 file link"
                      value={lehengaForm.video}
                      onChange={handleLehengaFormChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Form buttons */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="luxury-btn-secondary" style={{ padding: '10px 20px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="luxury-btn" style={{ padding: '10px 25px' }} disabled={formSubmitLoading}>
                    {formSubmitLoading ? 'Saving...' : 'Save Lehenga'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Inventory Table View */
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading products...</div>
              ) : lehengas.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No items in inventory. Click Add New Lehenga to begin.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#faf9f6', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: '600' }}>Item</th>
                      <th style={{ padding: '16px 20px', fontWeight: '600' }}>Size</th>
                      <th style={{ padding: '16px 20px', fontWeight: '600' }}>Rent / Day</th>
                      <th style={{ padding: '16px 20px', fontWeight: '600' }}>Deposit</th>
                      <th style={{ padding: '16px 20px', fontWeight: '600' }}>Discount</th>
                      <th style={{ padding: '16px 20px', fontWeight: '600' }}>Availability Status</th>
                      <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lehengas.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdfdfc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <img 
                            src={item.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=80"} 
                            alt={item.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{item.name}</div>
                            {item.video && (
                              <span style={{ fontSize: '11px', color: 'var(--gold-dark)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <i className="fa-solid fa-video"></i> Video Added
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: '12px', background: '#eae5e0', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {item.size}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--primary-color)' }}>
                          ₹{item.rentPrice}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                          ₹{item.securityDeposit || 5000}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {item.discount > 0 ? (
                            <span style={{ background: '#fdf2f2', color: '#d9534f', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                              {item.discount}% Off
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            color: item.leftTime.toLowerCase().includes('rent') ? '#d9534f' : '#5cb85c' 
                          }}>
                            {item.leftTime}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '10px' }}>
                            <button 
                              onClick={() => openEditForm(item)}
                              title="Edit item"
                              style={{ 
                                background: '#eae5e0', 
                                border: 'none', 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.3s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gold-color)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eae5e0'}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>

                            <button 
                              onClick={() => handleDeleteLehenga(item.id)}
                              title="Delete item"
                              style={{ 
                                background: '#fdf2f2', 
                                border: 'none', 
                                color: '#d9534f',
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.3s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8d7da'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdf2f2'}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        ) : (
          /* Web Settings Tab Configuration */
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '30px', boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Customize Store Details & Branding
            </h2>

            {settingsSuccess && (
              <div style={{ background: '#f2fdf2', color: '#5cb85c', border: '1px solid #5cb85c', padding: '10px 15px', borderRadius: '4px', marginBottom: '25px', fontSize: '14px' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> Website settings updated successfully! Changes are live on the user panel.
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Website Logo Text*</label>
                  <input 
                    type="text" 
                    name="logoText" 
                    placeholder="e.g. RV creation"
                    value={settingsForm.logoText}
                    onChange={handleSettingsFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Contact Email Address*</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="e.g. contact@rvcreation.com"
                    value={settingsForm.email}
                    onChange={handleSettingsFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Contact Phone No.*</label>
                  <input 
                    type="text" 
                    name="phone" 
                    placeholder="e.g. +91 98765 43210"
                    value={settingsForm.phone}
                    onChange={handleSettingsFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>WhatsApp Integration Number</label>
                  <input 
                    type="text" 
                    name="whatsapp" 
                    placeholder="e.g. +919876543210 (Country code, no spaces/plus)"
                    value={settingsForm.whatsapp}
                    onChange={handleSettingsFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Store Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    placeholder="Physical store address"
                    value={settingsForm.address}
                    onChange={handleSettingsFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Instagram Handle</label>
                  <input 
                    type="text" 
                    name="instagram" 
                    placeholder="e.g. rv_creation_rentals"
                    value={settingsForm.instagram}
                    onChange={handleSettingsFormChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <button type="submit" className="luxury-btn" style={{ padding: '12px 30px' }} disabled={settingsLoading}>
                  {settingsLoading ? 'Saving Settings...' : 'Save Site Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
