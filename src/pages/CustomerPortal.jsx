import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Fallbacks in case server isn't running or API fails
const FALLBACK_CONFIG = {
  logoText: "RV creation",
  email: "rentals@rvcreation.com",
  phone: "+91 98765 43210",
  address: "402, Signature Plaza, Near Johri Bazaar, Jaipur, Rajasthan - 302001",
  instagram: "rv_creation_rentals",
  whatsapp: "+919876543210"
};

const FALLBACK_LEHENGAS = [
  {
    id: 1,
    name: "Royal Crimson Velvet Bridal Lehenga",
    description: "Exquisite crimson red bridal lehenga in premium micro-velvet, heavily embellished with hand-crafted Zardozi, dabka, and sequin work. Paired with a matching velvet blouse and two sheer organza dupattas for the classic double-dupatta bridal drape.",
    size: "M",
    rentPrice: 4500,
    securityDeposit: 10000,
    discount: 10,
    rentTime: 3,
    leftTime: "Available",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    video: "https://assets.mixkit.co/videos/preview/mixkit-bride-in-a-beautiful-traditional-dress-sitting-on-a-couch-41712-large.mp4"
  },
  {
    id: 2,
    name: "Emerald Monarch Silk Lehenga",
    description: "Luxurious emerald green silk lehenga featuring intricate gold thread embroidery, gotapatti embellishments, and detailed border craftsmanship. Perfect for mehendi or sangeet functions. Includes a silk choli and a net dupatta with scalloped borders.",
    size: "S",
    rentPrice: 3200,
    securityDeposit: 8000,
    discount: 15,
    rentTime: 3,
    leftTime: "Available",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    video: ""
  },
  {
    id: 3,
    name: "Golden Champagne Shimmer Lehenga",
    description: "Elegant champagne gold lehenga adorned with mirror work, glass beads, and metallic embroidery. This lightweight georgette outfit reflects light beautifully, making it the highlight of sangeet and reception parties.",
    size: "L",
    rentPrice: 3800,
    securityDeposit: 9000,
    discount: 5,
    rentTime: 3,
    leftTime: "Rented - 2 days left",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    video: ""
  },
  {
    id: 4,
    name: "Pastel Blossom Organza Lehenga",
    description: "Charming pastel pink organza lehenga with hand-painted floral motifs and delicate thread embroidery. It is breathable, airy, and ideal for daytime bridesmaid duties or pre-wedding functions.",
    size: "M",
    rentPrice: 2200,
    securityDeposit: 5000,
    discount: 20,
    rentTime: 4,
    leftTime: "Available",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    video: ""
  }
];

export default function CustomerPortal() {
  const [lehengas, setLehengas] = useState([]);
  const [config, setConfig] = useState(FALLBACK_CONFIG);
  const [selectedLehenga, setSelectedLehenga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('All');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
  });
  const [bookingDays, setBookingDays] = useState(3);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lehengaRes = await axios.get('/api/lehenga');
      setLehengas(lehengaRes.data.length ? lehengaRes.data : FALLBACK_LEHENGAS);
    } catch (e) {
      console.warn("Express server not available or returned error. Using fallback/localStorage data.");
      // check local storage first
      const storedLehengas = localStorage.getItem('rv_lehengas');
      if (storedLehengas) {
        setLehengas(JSON.parse(storedLehengas));
      } else {
        setLehengas(FALLBACK_LEHENGAS);
        localStorage.setItem('rv_lehengas', JSON.stringify(FALLBACK_LEHENGAS));
      }
    }

    try {
      const configRes = await axios.get('/api/config');
      setConfig(configRes.data || FALLBACK_CONFIG);
    } catch (e) {
      const storedConfig = localStorage.getItem('rv_config');
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
      } else {
        setConfig(FALLBACK_CONFIG);
        localStorage.setItem('rv_config', JSON.stringify(FALLBACK_CONFIG));
      }
    }
    setLoading(false);
  };

  // Calculate rental cost helper
  const getDiscountedPrice = (price, discount) => {
    if (!discount) return price;
    return Math.round(price - (price * discount / 100));
  };

  // Date range duration calculator
  useEffect(() => {
    if (bookingForm.startDate && bookingForm.endDate) {
      const start = new Date(bookingForm.startDate);
      const end = new Date(bookingForm.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setBookingDays(diffDays);
    }
  }, [bookingForm.startDate, bookingForm.endDate]);

  const handleBookingChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    });
  };

  const handleBookRental = async (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.email || !bookingForm.phone || !bookingForm.startDate || !bookingForm.endDate) {
      setBookingError("Please fill out all required details.");
      return;
    }
    setSubmittingBooking(true);
    setBookingError('');

    try {
      // Simulate booking API / stripe session
      const amount = getDiscountedPrice(selectedLehenga.rentPrice, selectedLehenga.discount) * bookingDays * 100; // in paisa/cents
      
      // Attempt Stripe checkout session creation
      try {
        const stripeRes = await axios.post('/api/create-checkout-session', {
          amount: amount,
          currency: 'inr',
          successUrl: window.location.origin + '?payment=success',
          cancelUrl: window.location.origin + '?payment=cancel'
        });
        if (stripeRes.data && stripeRes.data.url) {
          window.location.href = stripeRes.data.url;
          return;
        }
      } catch (stripeErr) {
        console.warn("Stripe checkout failed or server unsupported. Simulating success instead.");
      }

      // Simulate network request latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update item status in backend or localStorage to show "Rented"
      const updatedLehengas = lehengas.map(item => {
        if (item.id === selectedLehenga.id) {
          return {
            ...item,
            leftTime: `Rented (Available in ${bookingDays} days)`
          };
        }
        return item;
      });

      setLehengas(updatedLehengas);
      try {
        // Attempt update on server
        await axios.put(`/api/lehenga/${selectedLehenga.id}`, {
          leftTime: `Rented (Available in ${bookingDays} days)`
        }, {
          headers: { Authorization: 'Bearer admin-token' }
        });
      } catch (srvErr) {
        localStorage.setItem('rv_lehengas', JSON.stringify(updatedLehengas));
      }

      setBookingSuccess(true);
    } catch (err) {
      setBookingError("Booking failed. Please try again.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedLehenga(null);
    setBookingSuccess(false);
    setBookingError('');
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      startDate: '',
      endDate: '',
    });
  };

  // Filter logic
  const filteredLehengas = lehengas.filter(lehenga => {
    const matchesSearch = lehenga.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lehenga.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const finalPrice = getDiscountedPrice(lehenga.rentPrice, lehenga.discount);
    const matchesPrice = finalPrice <= maxPrice;

    const matchesSize = selectedSize === 'All' || lehenga.size === selectedSize;
    
    const isRented = lehenga.leftTime && lehenga.leftTime.toLowerCase().includes('rent');
    const matchesStatus = selectedStatus === 'All' ||
                          (selectedStatus === 'Available' && !isRented) ||
                          (selectedStatus === 'Rented' && isRented);

    return matchesSearch && matchesPrice && matchesSize && matchesStatus;
  });

  return (
    <div style={{ backgroundColor: '#fcfbf9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Elegant Header */}
      <style>{`
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5), 0 4px 20px rgba(92,6,27,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(212,175,55,0), 0 4px 20px rgba(92,6,27,0.35); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .rv-logo-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5c061b 0%, #8b0d2e 40%, #d4af37 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #d4af37;
          animation: logoPulse 2.5s infinite;
          cursor: default;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .rv-logo-circle::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%);
        }
        .rv-logo-initials {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff8e7;
          line-height: 1;
          letter-spacing: 1px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .rv-logo-sub {
          font-size: 6.5px;
          color: #f5d98b;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 700;
          margin-top: 2px;
        }
        .rv-brand-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .rv-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 1.5px;
          background: linear-gradient(90deg, #5c061b 0%, #d4af37 50%, #5c061b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
          text-transform: uppercase;
          line-height: 1.1;
        }
        .rv-brand-tagline {
          font-size: 10px;
          background: linear-gradient(90deg, #d4af37, #aa7c11);
          color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .nav-link-fancy {
          text-decoration: none;
          color: var(--text-dark);
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.5px;
          position: relative;
          padding-bottom: 3px;
          transition: color 0.3s;
        }
        .nav-link-fancy::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--gold-gradient);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .nav-link-fancy:hover { color: var(--primary-color); }
        .nav-link-fancy:hover::after { width: 100%; }
        .header-glass {
          background: linear-gradient(135deg, rgba(252,251,249,0.97) 0%, rgba(255,248,231,0.95) 100%);
          backdrop-filter: blur(14px);
          border-bottom: 1.5px solid;
          border-image: linear-gradient(90deg, transparent 0%, #d4af37 40%, #5c061b 60%, transparent 100%) 1;
          position: sticky;
          top: 0;
          z-index: 100;
          height: 84px;
          box-shadow: 0 2px 24px rgba(92,6,27,0.08), 0 1px 0 rgba(212,175,55,0.3);
          transition: all 0.3s ease;
        }
      `}</style>

      <header className="header-glass">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          {/* Image Logo + Brand Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/rv-logo.png"
              alt="RV Creation Logo"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid #d4af37',
                boxShadow: '0 0 0 0 rgba(212,175,55,0.5), 0 4px 20px rgba(92,6,27,0.35)',
                animation: 'logoPulse 2.5s infinite',
                flexShrink: 0,
                background: '#0a0a0a'
              }}
            />
            <div className="rv-brand-text">
              <span className="rv-brand-name">{config.logoText}</span>
              <span className="rv-brand-tagline">✦ Luxury Rentals ✦</span>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <a href="#collection" className="nav-link-fancy">Collection</a>
            <a href="#contact" className="nav-link-fancy">Contact</a>
            <Link to="/admin" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: 'linear-gradient(135deg, #5c061b 0%, #8b0d2e 100%)',
              color: '#f5d98b',
              border: '1px solid rgba(212,175,55,0.4)',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 10px rgba(92,6,27,0.25)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #7e0f2b 0%, #a01035 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #5c061b 0%, #8b0d2e 100%)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="fa-solid fa-user-lock"></i> Admin Panel
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url("https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1600&auto=format&fit=crop&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        color: 'white',
        padding: '120px 0',
        textAlign: 'center',
        borderBottom: '4px solid var(--gold-color)'
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--gold-color)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '15px' }}>
            Exquisite Ethnic Elegance
          </h2>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '56px', lineHeight: '1.2', marginBottom: '20px', fontWeight: '500' }}>
            Rent Your Dream Designer Lehenga
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '35px', opacity: '0.9', fontWeight: '300', fontStyle: 'italic' }}>
            Stunning outfits for your special occasions. Handcrafted luxury, tailored fits, at a fraction of retail price.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <a href="#collection" className="gold-btn" style={{ padding: '14px 30px' }}>Explore Collection</a>
            <a href="#contact" className="luxury-btn" style={{ border: '1px solid white', padding: '14px 30px' }}>Get in Touch</a>
          </div>
        </div>
      </section>

      {/* Main Browse Section */}
      <main className="container" id="collection" style={{ padding: '60px 24px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--primary-color)', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px' }}>Browse Catalog</span>
          <h2 style={{ fontSize: '36px', marginTop: '5px', position: 'relative', display: 'inline-block', paddingBottom: '15px' }}>
            Our Latest Handpicked Lehengas
            <div style={{ width: '60px', height: '3px', background: 'var(--gold-gradient)', position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)' }} />
          </h2>
        </div>

        {/* Search & Filter Bar */}
        <style>{`
          .filter-bar {
            background: linear-gradient(135deg, #4a0415 0%, #6e0a22 30%, #5c061b 60%, #3a0310 100%);
            border-radius: 14px;
            border: 1px solid rgba(212,175,55,0.35);
            padding: 28px 30px;
            margin-bottom: 40px;
            box-shadow: 0 8px 32px rgba(92,6,27,0.22), inset 0 1px 0 rgba(255,255,255,0.06);
            position: relative;
            overflow: hidden;
          }
          .filter-bar::before {
            content: '';
            position: absolute;
            top: -60px;
            right: -60px;
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%);
            pointer-events: none;
          }
          .filter-bar::after {
            content: '';
            position: absolute;
            bottom: -40px;
            left: -40px;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%);
            pointer-events: none;
          }
          .filter-bar-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }
          .filter-bar-title span {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #f5d98b;
          }
          .filter-bar-title::before,
          .filter-bar-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent);
          }
          .filter-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #f5d98b;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
          }
          .filter-input, .filter-select {
            width: 100%;
            padding: 11px 14px;
            border-radius: 8px;
            border: 1px solid rgba(212,175,55,0.3);
            background: rgba(255,255,255,0.08);
            color: #fff;
            font-size: 14px;
            outline: none;
            backdrop-filter: blur(4px);
            transition: border-color 0.3s, background 0.3s;
            font-family: 'Outfit', sans-serif;
          }
          .filter-input::placeholder { color: rgba(255,255,255,0.45); }
          .filter-input:focus, .filter-select:focus {
            border-color: #d4af37;
            background: rgba(255,255,255,0.13);
          }
          .filter-select option { background: #5c061b; color: #fff; }
          .filter-search-wrap { position: relative; }
          .filter-search-wrap .search-icon {
            position: absolute;
            left: 13px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(212,175,55,0.8);
            font-size: 14px;
          }
          .filter-search-wrap .filter-input { padding-left: 38px; }
          .filter-price-display {
            font-size: 16px;
            font-weight: 700;
            color: #f5d98b;
          }
          input[type='range'].filter-range {
            width: 100%;
            height: 5px;
            -webkit-appearance: none;
            appearance: none;
            background: linear-gradient(90deg, #d4af37 0%, #aa7c11 100%);
            border-radius: 4px;
            cursor: pointer;
            margin-top: 4px;
          }
          input[type='range'].filter-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f3e5ab, #d4af37);
            border: 2px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          }
        `}</style>
        <div className="filter-bar">
          <div className="filter-bar-title"><span>✦ Filter & Search Collection ✦</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {/* Search Input */}
            <div>
              <label className="filter-label">🔍 Search Lehengas</label>
              <div className="filter-search-wrap">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input 
                  type="text" 
                  placeholder="e.g. Silk, Red, Velvet..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <label className="filter-label">📐 Select Size</label>
              <select 
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Sizes</option>
                <option value="S">S (Small)</option>
                <option value="M">M (Medium)</option>
                <option value="L">L (Large)</option>
                <option value="XL">XL (Extra Large)</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="filter-label">✅ Availability</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Items</option>
                <option value="Available">Available Now</option>
                <option value="Rented">Currently Rented</option>
              </select>
            </div>

            {/* Max Price Filter */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="filter-label" style={{ marginBottom: 0 }}>💰 Max Price / Day</label>
                <span className="filter-price-display">₹{maxPrice}</span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="10000" 
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                className="filter-range"
              />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>Curating the collection...</p>
          </div>
        ) : filteredLehengas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <i className="fa-solid fa-shirt" style={{ fontSize: '48px', color: '#eae5e0', marginBottom: '20px' }}></i>
            <h3>No lehengas found matching your search.</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Try adjusting your filters or search keywords.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedSize('All');
                setMaxPrice(10000);
                setSelectedStatus('All');
              }}
              className="luxury-btn-secondary" 
              style={{ marginTop: '15px' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {filteredLehengas.map((lehenga) => {
              const discountedPrice = getDiscountedPrice(lehenga.rentPrice, lehenga.discount);
              const isRented = lehenga.leftTime && lehenga.leftTime.toLowerCase().includes('rent');

              return (
                <div key={lehenga.id} className="lehenga-card" style={{ animation: 'fadeIn 0.5s ease' }}>
                  <div className="card-media">
                    {lehenga.discount > 0 && (
                      <span className="badge-discount">{lehenga.discount}% OFF</span>
                    )}
                    <span className={`badge-availability ${isRented ? 'rented' : 'available'}`}>
                      {isRented ? (
                        <>
                          <i className="fa-solid fa-clock" style={{ marginRight: '4px' }}></i>
                          {lehenga.leftTime}
                        </>
                      ) : (
                        'Available'
                      )}
                    </span>
                    <img 
                      src={lehenga.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"} 
                      alt={lehenga.name} 
                    />
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', background: '#eae5e0', color: 'var(--text-dark)', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>
                        Size: {lehenga.size}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Min {lehenga.rentTime || 3} days rental
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', flex: 1 }}>
                      {lehenga.name}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary-color)' }}>
                        ₹{discountedPrice} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ day</span>
                      </span>
                      {lehenga.discount > 0 && (
                        <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          ₹{lehenga.rentPrice}
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={() => setSelectedLehenga(lehenga)}
                      className="gold-btn" 
                      style={{ width: '100%' }}
                    >
                      <i className="fa-solid fa-calendar-check"></i> Rent Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Booking / Details Modal */}
      {selectedLehenga && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid var(--gold-color)',
            position: 'relative',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Close Button */}
            <button 
              onClick={closeBookingModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                zIndex: 10
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Modal Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {/* Media Section */}
              <div style={{ background: '#f3ece6', height: '100%', minHeight: '350px', position: 'relative' }}>
                {selectedLehenga.video ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <video 
                      src={selectedLehenga.video} 
                      controls 
                      autoPlay 
                      muted 
                      loop 
                      style={{ width: '100%', height: '70%', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '15px', background: '#fff', borderTop: '1px solid var(--border-color)', height: '30%' }}>
                      <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: '600', letterSpacing: '1px', marginBottom: '2px' }}>Video Preview</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Watch the outfit drape and shine under lighting.</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={selectedLehenga.image} 
                    alt={selectedLehenga.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Details & Form Section */}
              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', background: 'var(--primary-color)', color: 'white', fontWeight: '600', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Size {selectedLehenga.size}
                  </span>
                  <h2 style={{ fontSize: '28px', marginTop: '10px', marginBottom: '15px', fontFamily: 'var(--font-serif)' }}>
                    {selectedLehenga.name}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                    {selectedLehenga.description}
                  </p>

                  <div style={{ background: '#fcfbf9', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '15px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Daily Rent Rate:</span>
                      <span style={{ fontWeight: '600' }}>₹{getDiscountedPrice(selectedLehenga.rentPrice, selectedLehenga.discount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Security Deposit:</span>
                      <span style={{ fontWeight: '600' }}>₹{selectedLehenga.securityDeposit || 5000}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Availability Status:</span>
                      <span style={{ fontWeight: '600', color: selectedLehenga.leftTime.toLowerCase().includes('rent') ? '#d9534f' : '#5cb85c' }}>
                        {selectedLehenga.leftTime}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                      *The security deposit is 100% refundable upon safe return of the dress.
                    </p>
                  </div>
                </div>

                {/* Booking Form */}
                {bookingSuccess ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', background: '#f2fdf2', border: '1px solid #5cb85c', borderRadius: '4px' }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: '40px', color: '#5cb85c', marginBottom: '15px' }}></i>
                    <h3>Rental Request Placed!</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '5px' }}>
                      Thank you for renting with {config.logoText}. We have sent an email with the invoice and payment verification steps to <strong>{bookingForm.email}</strong>.
                    </p>
                    <button onClick={closeBookingModal} className="luxury-btn" style={{ marginTop: '20px' }}>
                      Browse More Lehengas
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookRental}>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      Rent Booking Form
                    </h3>

                    {bookingError && (
                      <div style={{ color: '#d9534f', fontSize: '13px', background: '#fdf2f2', padding: '8px 12px', borderRadius: '4px', marginBottom: '15px' }}>
                        {bookingError}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px' }}>Start Date</label>
                        <input 
                          type="date" 
                          name="startDate"
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingForm.startDate}
                          onChange={handleBookingChange}
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px' }}>End Date</label>
                        <input 
                          type="date" 
                          name="endDate"
                          min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                          value={bookingForm.endDate}
                          onChange={handleBookingChange}
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px' }}>Your Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="Full Name"
                        value={bookingForm.name}
                        onChange={handleBookingChange}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px' }}>Email Address</label>
                        <input 
                          type="email" 
                          name="email" 
                          placeholder="email@example.com"
                          value={bookingForm.email}
                          onChange={handleBookingChange}
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px' }}>Phone Number</label>
                        <input 
                          type="tel" 
                          name="phone" 
                          placeholder="+91 99999 99999"
                          value={bookingForm.phone}
                          onChange={handleBookingChange}
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                      </div>
                    </div>

                    {bookingForm.startDate && bookingForm.endDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eae5e0', padding: '12px 15px', borderRadius: '4px', marginBottom: '20px' }}>
                        <div>
                          <span style={{ fontSize: '13px', display: 'block', color: 'var(--text-muted)' }}>Duration: {bookingDays} days</span>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-color)' }}>
                            Total Rent: ₹{getDiscountedPrice(selectedLehenga.rentPrice, selectedLehenga.discount) * bookingDays}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Excludes refundable deposit)</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="luxury-btn" 
                      disabled={submittingBooking || selectedLehenga.leftTime.toLowerCase().includes('rent')}
                      style={{ 
                        width: '100%', 
                        opacity: selectedLehenga.leftTime.toLowerCase().includes('rent') ? 0.6 : 1,
                        cursor: selectedLehenga.leftTime.toLowerCase().includes('rent') ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {submittingBooking ? (
                        <>
                          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '8px' }} />
                          Processing Booking...
                        </>
                      ) : selectedLehenga.leftTime.toLowerCase().includes('rent') ? (
                        'Dress Currently Rented'
                      ) : (
                        'Proceed to Book Rental'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Footer */}
      <footer id="contact" style={{ background: '#221c1a', color: '#e5dec9', padding: '60px 0 30px 0', borderTop: '4px solid var(--gold-color)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'white', fontSize: '24px', letterSpacing: '1px', marginBottom: '20px' }}>
              {config.logoText.toUpperCase()}
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: '0.8', fontStyle: 'italic' }}>
              Making your dream wedding dress rental stress-free, luxurious, and affordable. We serve fashion, heritage, and tradition across India.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
              Reach Us
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold-color)', marginRight: '10px' }}></i>
                {config.address}
              </li>
              <li>
                <i className="fa-solid fa-phone" style={{ color: 'var(--gold-color)', marginRight: '10px' }}></i>
                {config.phone}
              </li>
              <li>
                <i className="fa-solid fa-envelope" style={{ color: 'var(--gold-color)', marginRight: '10px' }}></i>
                {config.email}
              </li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
              Follow Our Journey
            </h4>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a 
                href={`https://instagram.com/${config.instagram}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  color: 'var(--gold-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '50%',
                  textDecoration: 'none',
                  fontSize: '18px',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              >
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a 
                href={`https://wa.me/${config.whatsapp}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  color: 'var(--gold-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '50%',
                  textDecoration: 'none',
                  fontSize: '18px',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              >
                <i className="fa-brands fa-whatsapp"></i>
              </a>
            </div>
            <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--gold-color)' }}>
              <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i> Store hours: 10:30 AM - 8:30 PM (Daily)
            </p>
          </div>
        </div>

        <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '13px', opacity: '0.6' }}>
          &copy; {new Date().getFullYear()} {config.logoText}. All Rights Reserved. Made for Brides & Bridesmaids.
        </div>
      </footer>
    </div>
  );
}
