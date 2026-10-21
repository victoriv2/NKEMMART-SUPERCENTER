/**
 * RALPHMART SUPERCENTER - SUPABASE CLIENT & AUTH HELPER
 * Project: nkemmart.supercenter@gmail.com's Project
 * Region: eu-west-1
 */

const SUPABASE_CONFIG = {
  url: 'https://ykwhhgajybhbmkqkmzhm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrd2hoZ2FqeWJoYm1rcWttemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MTI5NzksImV4cCI6MjEwNzk4ODk3OX0.d-qkmKCGE1bbMBNZb7ROnMXC1t1RcPweeXD4Hg0atBM'
};

// Initialize Supabase Client
let _supabaseInstance = null;

function getSupabase() {
  if (_supabaseInstance) return _supabaseInstance;
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabaseInstance = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return _supabaseInstance;
  }
  console.warn('Supabase JS library not loaded. Make sure @supabase/supabase-js is included via script tag.');
  return null;
}

// Authentication Helpers
async function getCurrentUser() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) return null;
    return user;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

async function getCurrentSession() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) return null;
    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
}

async function getCurrentProfile() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Profile fetch note:', error.message);
    }

    // Default admin detection for store owner
    const isOwner = user.email && (user.email.toLowerCase() === 'ralphmart.supercenter@gmail.com' || user.email.toLowerCase() === 'nkemmart.supercenter@gmail.com');
    const role = (profile && profile.role) || (isOwner ? 'admin' : 'customer');

    const stateName = (profile && profile.state) || user.user_metadata?.state || '';
    const stateKey = (profile && profile.state_key) || user.user_metadata?.state_key || '';
    const lga = (profile && profile.lga) || user.user_metadata?.lga || '';

    // If user profile has state & LGA, sync to localStorage user location
    if (stateKey && typeof window !== 'undefined') {
      try {
        const locations = window.NIGERIA_LOCATIONS || null;
        const stateData = locations ? locations[stateKey] : null;
        const locObj = {
          stateKey: stateKey,
          stateName: (stateData && stateData.name) || stateName || stateKey,
          city: lga || '',
          cost: (stateData && stateData.cost) || '₦ 2,500',
          time: (stateData && stateData.time) || 'Within 48 - 72 Hours'
        };
        localStorage.setItem('nkemmart_user_location', JSON.stringify(locObj));
      } catch (locErr) {
        // Silent fallback
      }
    }

    const fName = (profile && profile.first_name) || user.user_metadata?.first_name || '';
    const lName = (profile && profile.last_name) || user.user_metadata?.last_name || '';
    const computedFull = (profile && profile.full_name) || user.user_metadata?.full_name || (fName && lName ? `${fName} ${lName}` : (fName || lName || user.email.split('@')[0]));

    return {
      id: user.id,
      email: user.email,
      first_name: fName,
      last_name: lName,
      full_name: computedFull,
      phone: (profile && profile.phone) || user.user_metadata?.phone || '',
      state: stateName,
      state_key: stateKey,
      lga: lga,
      role: role,
      avatar_url: profile?.avatar_url || null,
      created_at: profile?.created_at || user.created_at
    };
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

async function signUpUser(email, password, { firstName, lastName, fullName, phone, state, stateKey, lga }) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client unavailable');

  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const computedFullName = (fullName || (fName && lName ? `${fName} ${lName}` : (fName || lName))).trim();

  const isOwner = (email.trim().toLowerCase() === 'ralphmart.supercenter@gmail.com' || email.trim().toLowerCase() === 'nkemmart.supercenter@gmail.com');
  const role = isOwner ? 'admin' : 'customer';

  const metadata = {
    first_name: fName,
    last_name: lName,
    full_name: computedFullName,
    phone: (phone || '').trim(),
    state: (state || '').trim(),
    state_key: (stateKey || '').trim(),
    lga: (lga || '').trim(),
    role: role
  };

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: metadata
    }
  });

  if (error) throw error;

  // Persist chosen location immediately to localStorage
  if (stateKey && typeof window !== 'undefined') {
    try {
      const locations = window.NIGERIA_LOCATIONS || null;
      const stateData = locations ? locations[stateKey] : null;
      const locObj = {
        stateKey: stateKey,
        stateName: (stateData && stateData.name) || state || stateKey,
        city: lga || '',
        cost: (stateData && stateData.cost) || '₦ 2,500',
        time: (stateData && stateData.time) || 'Within 48 - 72 Hours'
      };
      localStorage.setItem('nkemmart_user_location', JSON.stringify(locObj));
    } catch (e) {
      // Storage fallback
    }
  }

  return data;
}

async function signInUser(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client unavailable');

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) throw error;
  return data;
}

async function updateUserProfile({ firstName, lastName, phone, state, stateKey, lga }) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client unavailable');

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new Error('You must be signed in to update your profile.');

  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const fullName = (fName && lName ? `${fName} ${lName}` : (fName || lName)).trim();

  // 1. Update public.profiles table in Supabase
  const { data: updatedProfile, error: profileError } = await client
    .from('profiles')
    .update({
      first_name: fName,
      last_name: lName,
      full_name: fullName,
      phone: (phone || '').trim(),
      state: (state || '').trim(),
      state_key: (stateKey || '').trim(),
      lga: (lga || '').trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (profileError) {
    console.warn('Profile table update error:', profileError);
    throw profileError;
  }

  // 2. Update auth user metadata
  try {
    await client.auth.updateUser({
      data: {
        first_name: fName,
        last_name: lName,
        full_name: fullName,
        phone: (phone || '').trim(),
        state: (state || '').trim(),
        state_key: (stateKey || '').trim(),
        lga: (lga || '').trim()
      }
    });
  } catch (authErr) {
    console.warn('Auth metadata update notice:', authErr);
  }

  // 3. Update localStorage location immediately so fees and shipping update across store
  if (stateKey && typeof window !== 'undefined') {
    try {
      const locations = window.NIGERIA_LOCATIONS || null;
      const stateData = locations ? locations[stateKey] : null;
      const locObj = {
        stateKey: stateKey,
        stateName: (stateData && stateData.name) || state || stateKey,
        city: lga || '',
        cost: (stateData && stateData.cost) || '₦ 2,500',
        time: (stateData && stateData.time) || 'Within 48 - 72 Hours'
      };
      localStorage.setItem('nkemmart_user_location', JSON.stringify(locObj));
    } catch (e) {}
  }

  return await getCurrentProfile();
}

async function signOutUser() {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) console.error('Sign out error:', error);
}

async function resetPasswordForEmail(email) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client unavailable');

  const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin + '/auth.html#reset'
  });

  if (error) throw error;
  return data;
}

function onAuthChange(callback) {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    if (typeof callback === 'function') {
      callback(event, session);
    }
  });

  return subscription;
}

// Global Auth UI Bar Update Helper (updates Account dropdowns across the site)
async function updateSiteAccountMenu() {
  try {
    const profile = await getCurrentProfile();
    const accountButtons = document.querySelectorAll('#accountMenuBtn, .account-btn-header');
    const accountDropdowns = document.querySelectorAll('#accountMenu, .account-dropdown-menu');

    if (profile) {
      accountButtons.forEach(btn => {
        const textSpan = btn.querySelector('span:not(.chevron-icon)');
        if (textSpan) {
          const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'Account';
          textSpan.textContent = firstName.length > 10 ? firstName.substring(0, 9) + '...' : firstName;
        }
      });

      accountDropdowns.forEach(menu => {
        let adminItemHtml = '';
        if (profile.role === 'admin') {
          adminItemHtml = `
            <a href="admin.html" class="dropdown-item" style="color: #512175; font-weight: 700; background: rgba(81, 33, 117, 0.1);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
              <span>Admin Portal</span>
            </a>
            <div class="dropdown-divider"></div>
          `;
        }

        menu.innerHTML = `
          <a href="profile.html" style="text-decoration: none; display: block; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; transition: all 0.2s; cursor: pointer;" onmouseover="this.style.background='#f3e8ff'" onmouseout="this.style.background='#f8fafc'" title="Click to edit profile info">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="font-size: 13px; font-weight: 800; color: #091e3a;">${escapeHtml(profile.full_name)}</div>
              <span style="font-size: 11px; font-weight: 700; color: #512175; text-decoration: underline;">Edit Info</span>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">${escapeHtml(profile.email)}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
              <span style="display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${profile.role === 'admin' ? '#dcfce7; color: #15803d;' : '#e0f2fe; color: #0369a1;'}">${profile.role}</span>
              ${profile.state ? `<span style="font-size: 11px; color: #475569; font-weight: 500;">${escapeHtml(profile.lga ? profile.lga + ', ' : '')}${escapeHtml(profile.state)}</span>` : ''}
            </div>
          </a>
          <a href="profile.html" class="dropdown-item" style="color: #512175; font-weight: 700;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit Profile &amp; Info</span>
          </a>
          ${adminItemHtml}
          <a href="index.html#orders" class="dropdown-item">My Orders</a>
          <a href="saved-items.html" class="dropdown-item">Saved Items</a>
          <a href="cart.html" class="dropdown-item">Shopping Cart</a>
          <div class="dropdown-divider"></div>
          <button type="button" class="dropdown-item" id="siteSignOutBtn" style="color: #ef4444; width: 100%; text-align: left; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Sign Out</span>
          </button>
        `;

        const signOutBtn = menu.querySelector('#siteSignOutBtn');
        if (signOutBtn) {
          signOutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOutUser();
            window.location.reload();
          });
        }
      });

      // Update mobile drawer account items if present
      const mobileAccountItems = document.querySelectorAll('#mobileAccountSubNav a[href="auth.html"], .mobile-account-auth-link');
      mobileAccountItems.forEach(item => {
        item.href = 'profile.html';
        const span = item.querySelector('span');
        if (span) {
          const fName = profile.first_name || (profile.full_name ? profile.full_name.split(' ')[0] : 'My Profile');
          span.textContent = 'Edit Profile (' + fName + ')';
        }
      });
    }
  } catch (e) {
    console.warn('Error updating account menu:', e);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Universal Header & Mobile Drawer Badge Synchronizer
function syncAllBadges() {
  try {
    var cartData = JSON.parse(localStorage.getItem('nkemmart_cart') || '[]');
    var cartQty = cartData.reduce(function(sum, it) { return sum + (it.qty || 1); }, 0);
    
    var headerCart = document.getElementById('headerCartBadge');
    if (headerCart) {
      headerCart.textContent = cartQty;
      headerCart.style.display = cartQty > 0 ? 'flex' : 'none';
    }
    var mobileCart = document.getElementById('mobileCartBadge');
    if (mobileCart) {
      mobileCart.textContent = cartQty;
      mobileCart.style.display = cartQty > 0 ? 'flex' : 'none';
    }
    var dropdownCart = document.getElementById('dropdownCartBadge');
    if (dropdownCart) {
      dropdownCart.textContent = cartQty;
      dropdownCart.style.display = cartQty > 0 ? 'flex' : 'none';
    }

    var savedData = JSON.parse(localStorage.getItem('nkemmart_saved_items') || '[]');
    var savedCount = Array.isArray(savedData) ? savedData.length : 0;

    var headerSaved = document.getElementById('headerSavedBadge');
    if (headerSaved) {
      headerSaved.textContent = savedCount;
      headerSaved.style.display = savedCount > 0 ? 'flex' : 'none';
    }
    var mobileSaved = document.getElementById('mobileSavedBadge');
    if (mobileSaved) {
      mobileSaved.textContent = savedCount;
      mobileSaved.style.display = savedCount > 0 ? 'flex' : 'none';
    }
    var dropdownSaved = document.getElementById('dropdownSavedBadge');
    if (dropdownSaved) {
      dropdownSaved.textContent = savedCount;
      dropdownSaved.style.display = savedCount > 0 ? 'flex' : 'none';
    }
  } catch (e) {
    console.warn('Badge sync note:', e);
  }
}

// Universal Smart Sticky Header Controller
function initSmartHeader() {
  var topBar = document.querySelector('.top-bar');
  var mainHeader = document.querySelector('.main-header') || document.querySelector('.auth-header');
  if (!mainHeader && !topBar) return;

  var wrapper = document.querySelector('.site-header-wrapper');
  if (!wrapper && topBar && mainHeader && topBar.nextElementSibling === mainHeader) {
    wrapper = document.createElement('div');
    wrapper.className = 'site-header-wrapper';
    topBar.parentNode.insertBefore(wrapper, topBar);
    wrapper.appendChild(topBar);
    wrapper.appendChild(mainHeader);
  } else if (!wrapper) {
    wrapper = mainHeader || topBar;
  }

  if (wrapper.dataset.smartHeaderInitialized) return;
  wrapper.dataset.smartHeaderInitialized = 'true';

  var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  var isTicking = false;

  window.addEventListener('scroll', function() {
    if (document.body.classList.contains('modal-open') || document.body.classList.contains('drawer-open')) return;

    if (!isTicking) {
      window.requestAnimationFrame(function() {
        var currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (currentScrollY < 0) currentScrollY = 0;

        // If near the top, reset and show normal resting header
        if (currentScrollY <= 25) {
          wrapper.classList.remove('header-hidden');
          wrapper.classList.remove('header-scrolled-up');
          if (mainHeader && mainHeader !== wrapper) {
            mainHeader.classList.remove('header-hidden');
            mainHeader.classList.remove('header-scrolled-up');
          }
          if (topBar && topBar !== wrapper) {
            topBar.classList.remove('header-hidden');
            topBar.classList.remove('header-scrolled-up');
          }
          lastScrollY = currentScrollY;
          isTicking = false;
          return;
        }

        var scrollDelta = currentScrollY - lastScrollY;

        // Scrolling DOWN -> Hide header to maximize screen space
        if (scrollDelta > 4 && currentScrollY > 70) {
          if (typeof closeAllPopups === 'function') closeAllPopups();
          wrapper.classList.add('header-hidden');
          wrapper.classList.remove('header-scrolled-up');
          if (mainHeader && mainHeader !== wrapper) {
            mainHeader.classList.add('header-hidden');
            mainHeader.classList.remove('header-scrolled-up');
          }
          if (topBar && topBar !== wrapper) {
            topBar.classList.add('header-hidden');
            topBar.classList.remove('header-scrolled-up');
          }
        } 
        // Scrolling UP even a little bit (2px threshold) -> Reveal header immediately
        else if (scrollDelta < -2) {
          wrapper.classList.remove('header-hidden');
          wrapper.classList.add('header-scrolled-up');
          if (mainHeader && mainHeader !== wrapper) {
            mainHeader.classList.remove('header-hidden');
            mainHeader.classList.add('header-scrolled-up');
          }
          if (topBar && topBar !== wrapper) {
            topBar.classList.remove('header-hidden');
            topBar.classList.add('header-scrolled-up');
          }
        }

        lastScrollY = currentScrollY;
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });
}

// Universal Back-to-Top Button Handler
function initBackToTop() {
  var btn = document.querySelector('.back-to-top-btn');
  if (!btn || btn.dataset.initialized) return;
  btn.dataset.initialized = 'true';
  window.addEventListener('scroll', function() {
    if (window.scrollY > 280) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Auto update menu, badges, smart header, and back-to-top on DOM load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncAllBadges();
      initSmartHeader();
      initBackToTop();
      setTimeout(updateSiteAccountMenu, 300);
    });
  } else {
    syncAllBadges();
    initSmartHeader();
    initBackToTop();
    setTimeout(updateSiteAccountMenu, 300);
  }
  window.addEventListener('storage', syncAllBadges);
}
