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

async function checkEmailExists(email) {
  const client = getSupabase();
  if (!client || !email) return false;
  try {
    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanEmail) return false;
    const { data, error } = await client.rpc('check_email_exists', { lookup_email: cleanEmail });
    if (error) {
      console.warn('check_email_exists RPC note:', error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.warn('Error checking email existence:', err);
    return false;
  }
}

async function signUpUser(email, password, { firstName, lastName, fullName, phone, state, stateKey, lga }) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client unavailable');

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Please enter a valid email address.');

  // 1. Pre-check if email is already registered on the server
  const alreadyExists = await checkEmailExists(cleanEmail);
  if (alreadyExists) {
    throw new Error('An account with this email address already exists. Please log in or use another email.');
  }

  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const computedFullName = (fullName || (fName && lName ? `${fName} ${lName}` : (fName || lName))).trim();

  const isOwner = (cleanEmail === 'ralphmart.supercenter@gmail.com' || cleanEmail === 'nkemmart.supercenter@gmail.com');
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
    email: cleanEmail,
    password: password,
    options: {
      data: metadata
    }
  });

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('email_exists') || msg.includes('user already exists') || msg.includes('duplicate')) {
      throw new Error('An account with this email address already exists. Please log in or use another email.');
    }
    throw error;
  }

  // 2. Supabase Auth returns an empty identities array if user enumeration protection is enabled and the email already exists
  if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('An account with this email address already exists. Please log in or use another email.');
  }

  if (!data || !data.user) {
    throw new Error('Account registration could not be completed. Please try again.');
  }

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

  if (data && data.user && data.session) {
    try {
      if (typeof logUserActivity === 'function') {
        logUserActivity('signup', 'Created new RALPHMART account', { email: email.trim(), name: computedFullName });
      }
      if (typeof mergeGuestCartOnLogin === 'function') await mergeGuestCartOnLogin();
      if (typeof setupRealtimeSync === 'function') await setupRealtimeSync();
    } catch (e) {}
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

  try {
    if (typeof logUserActivity === 'function') {
      logUserActivity('login', 'Signed into account', { email: email.trim() });
    }
    if (typeof mergeGuestCartOnLogin === 'function') {
      await mergeGuestCartOnLogin();
    }
    if (typeof setupRealtimeSync === 'function') {
      await setupRealtimeSync();
    }
  } catch (syncErr) {}

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

  // 4. Log profile edit activity
  if (typeof logUserActivity === 'function') {
    logUserActivity('profile_updated', 'Updated personal and delivery profile', {
      name: fullName,
      phone: phone,
      state: state,
      lga: lga
    });
  }

  return await getCurrentProfile();
}

// User Activity Logger
async function logUserActivity(activityType, activityTitle, details = {}) {
  try {
    const client = getSupabase();
    if (!client) return;
    const user = await getCurrentUser();
    if (!user) return;

    await client.from('user_activities').insert([{
      user_id: user.id,
      user_email: user.email,
      activity_type: activityType,
      activity_title: activityTitle,
      activity_details: details,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.warn('Activity logging notice:', err);
  }
}

// Fetch User Activities for Profile Timeline and Activities Page
async function getUserActivities(limit = 100, activityType = null, sortAscending = false) {
  try {
    const client = getSupabase();
    if (!client) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    let query = client
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: Boolean(sortAscending) });

    if (activityType && activityType !== 'all') {
      query = query.eq('activity_type', activityType);
    }

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Notice fetching activities:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error getting activities:', err);
    return [];
  }
}

// Fetch User Orders
async function getUserOrders() {
  try {
    const client = getSupabase();
    if (!client) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await client
      .from('orders')
      .select('*')
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice fetching user orders:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error getting orders:', err);
    return [];
  }
}

let _isSyncingFromCloud = false;
let realtimeChannel = null;

// Explicit Cart Sync to Supabase
async function syncCartToCloud(cartArray) {
  try {
    if (!Array.isArray(cartArray)) return;
    const now = Date.now();
    localStorage.setItem('nkemmart_cart_time', now.toString());
    localStorage.setItem('nkemmart_cart', JSON.stringify(cartArray));
    if (typeof syncAllBadges === 'function') syncAllBadges();

    const client = getSupabase();
    if (!client) return;
    const user = await getCurrentUser();
    if (!user) return;

    await client
      .from('profiles')
      .update({
        cart: cartArray,
        cart_updated_at: new Date(now).toISOString(),
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id);

    const title = cartArray.length > 0 ? ('Updated shopping cart (' + cartArray.length + ' item' + (cartArray.length > 1 ? 's' : '') + ')') : 'Cleared shopping cart';
    logUserActivity('cart_update', title, { count: cartArray.length });
  } catch (e) {
    console.warn('Notice syncing cart to cloud:', e);
  }
}

// Explicit Saved Items Sync to Supabase
async function syncSavedToCloud(savedArray) {
  try {
    if (!Array.isArray(savedArray)) return;
    const now = Date.now();
    localStorage.setItem('nkemmart_saved_time', now.toString());
    localStorage.setItem('nkemmart_saved_items', JSON.stringify(savedArray));
    if (typeof syncAllBadges === 'function') syncAllBadges();

    const client = getSupabase();
    if (!client) return;
    const user = await getCurrentUser();
    if (!user) return;

    await client
      .from('profiles')
      .update({
        saved_items: savedArray,
        saved_updated_at: new Date(now).toISOString(),
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id);

    const title = savedArray.length > 0 ? ('Updated saved items (' + savedArray.length + ' item' + (savedArray.length > 1 ? 's' : '') + ')') : 'Cleared saved items';
    logUserActivity('saved_update', title, { count: savedArray.length });
  } catch (e) {
    console.warn('Notice syncing saved to cloud:', e);
  }
}

// Guest Cart Merge on Login
async function mergeGuestCartOnLogin() {
  try {
    const client = getSupabase();
    if (!client) return;
    const user = await getCurrentUser();
    if (!user) return;

    const { data: profile } = await client
      .from('profiles')
      .select('cart, saved_items, cart_updated_at, saved_updated_at')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const cloudCart = Array.isArray(profile.cart) ? profile.cart : [];
    const cloudSaved = Array.isArray(profile.saved_items) ? profile.saved_items : [];

    let localCart = [];
    try { localCart = JSON.parse(localStorage.getItem('nkemmart_cart') || '[]'); } catch (e) {}
    let localSaved = [];
    try { localSaved = JSON.parse(localStorage.getItem('nkemmart_saved_items') || '[]'); } catch (e) {}

    const lastAuthedUser = localStorage.getItem('nkemmart_last_authed_user');

    // If this device was already used by this same user, cloud is the absolute truth!
    if (lastAuthedUser === user.id) {
      _isSyncingFromCloud = true;
      localStorage.setItem('nkemmart_cart', JSON.stringify(cloudCart));
      localStorage.setItem('nkemmart_saved_items', JSON.stringify(cloudSaved));
      const cTime = profile.cart_updated_at ? new Date(profile.cart_updated_at).getTime() : Date.now();
      const sTime = profile.saved_updated_at ? new Date(profile.saved_updated_at).getTime() : Date.now();
      localStorage.setItem('nkemmart_cart_time', cTime.toString());
      localStorage.setItem('nkemmart_saved_time', sTime.toString());
      _isSyncingFromCloud = false;
      if (typeof syncAllBadges === 'function') syncAllBadges();
      return;
    }

    // New device or guest session login: merge unique guest items
    const cartMap = new Map();
    cloudCart.forEach(it => { if (it && (it.id || it.title)) cartMap.set(String(it.id || it.title), it); });
    let hasNewGuestItems = false;
    localCart.forEach(it => {
      if (it && (it.id || it.title)) {
        const key = String(it.id || it.title);
        if (cartMap.has(key)) {
          const ex = cartMap.get(key);
          ex.qty = Math.max(ex.qty || 1, it.qty || 1);
        } else {
          cartMap.set(key, it);
          hasNewGuestItems = true;
        }
      }
    });

    const finalCart = Array.from(cartMap.values());
    const now = Date.now();

    _isSyncingFromCloud = true;
    localStorage.setItem('nkemmart_cart', JSON.stringify(finalCart));
    localStorage.setItem('nkemmart_cart_time', now.toString());
    localStorage.setItem('nkemmart_last_authed_user', user.id);
    _isSyncingFromCloud = false;

    if (hasNewGuestItems || finalCart.length !== cloudCart.length) {
      await client.from('profiles').update({
        cart: finalCart,
        cart_updated_at: new Date(now).toISOString(),
        last_active_at: new Date().toISOString()
      }).eq('id', user.id);
    }

    // Merge saved items
    const savedMap = new Map();
    cloudSaved.forEach(it => { if (it && (it.id || it.title)) savedMap.set(String(it.id || it.title), it); });
    let hasNewGuestSaved = false;
    localSaved.forEach(it => {
      if (it && (it.id || it.title)) {
        const key = String(it.id || it.title);
        if (!savedMap.has(key)) {
          savedMap.set(key, it);
          hasNewGuestSaved = true;
        }
      }
    });
    const finalSaved = Array.from(savedMap.values());
    _isSyncingFromCloud = true;
    localStorage.setItem('nkemmart_saved_items', JSON.stringify(finalSaved));
    localStorage.setItem('nkemmart_saved_time', now.toString());
    _isSyncingFromCloud = false;

    if (hasNewGuestSaved || finalSaved.length !== cloudSaved.length) {
      await client.from('profiles').update({
        saved_items: finalSaved,
        saved_updated_at: new Date(now).toISOString(),
        last_active_at: new Date().toISOString()
      }).eq('id', user.id);
    }

    if (typeof syncAllBadges === 'function') syncAllBadges();
  } catch (e) {
    console.warn('Notice merging guest cart on login:', e);
  } finally {
    _isSyncingFromCloud = false;
  }
}

// Bidirectional Cloud & Local Synchronizer for Logged-In Users
async function syncUserDataWithSupabase(force = false) {
  try {
    const client = getSupabase();
    if (!client) return;
    const user = await getCurrentUser();
    if (!user) return;

    localStorage.setItem('nkemmart_last_authed_user', user.id);

    const { data: profile, error } = await client
      .from('profiles')
      .select('cart, saved_items, cart_updated_at, saved_updated_at, last_active_at')
      .eq('id', user.id)
      .single();

    if (error || !profile) return;

    const cloudCartTime = profile.cart_updated_at ? new Date(profile.cart_updated_at).getTime() : 0;
    const localCartTime = parseInt(localStorage.getItem('nkemmart_cart_time') || '0', 10);
    const cloudCart = Array.isArray(profile.cart) ? profile.cart : [];

    let localCart = [];
    try { localCart = JSON.parse(localStorage.getItem('nkemmart_cart') || '[]'); } catch (e) {}

    // Check if this device has pending local edits newer than cloud
    if (localCartTime > cloudCartTime && !force) {
      await client.from('profiles').update({
        cart: localCart,
        cart_updated_at: new Date(localCartTime).toISOString(),
        last_active_at: new Date().toISOString()
      }).eq('id', user.id);
    } else {
      // Cloud is authoritative
      _isSyncingFromCloud = true;
      localStorage.setItem('nkemmart_cart', JSON.stringify(cloudCart));
      localStorage.setItem('nkemmart_cart_time', Math.max(cloudCartTime, localCartTime).toString());
      _isSyncingFromCloud = false;
      window.dispatchEvent(new CustomEvent('nkemmart_cart_synced', { detail: { cart: cloudCart } }));
    }

    // Saved items sync
    const cloudSavedTime = profile.saved_updated_at ? new Date(profile.saved_updated_at).getTime() : 0;
    const localSavedTime = parseInt(localStorage.getItem('nkemmart_saved_time') || '0', 10);
    const cloudSaved = Array.isArray(profile.saved_items) ? profile.saved_items : [];

    let localSaved = [];
    try { localSaved = JSON.parse(localStorage.getItem('nkemmart_saved_items') || '[]'); } catch (e) {}

    if (localSavedTime > cloudSavedTime && !force) {
      await client.from('profiles').update({
        saved_items: localSaved,
        saved_updated_at: new Date(localSavedTime).toISOString(),
        last_active_at: new Date().toISOString()
      }).eq('id', user.id);
    } else {
      _isSyncingFromCloud = true;
      localStorage.setItem('nkemmart_saved_items', JSON.stringify(cloudSaved));
      localStorage.setItem('nkemmart_saved_time', Math.max(cloudSavedTime, localSavedTime).toString());
      _isSyncingFromCloud = false;
      window.dispatchEvent(new CustomEvent('nkemmart_saved_synced', { detail: { saved_items: cloudSaved } }));
    }

    if (typeof syncAllBadges === 'function') syncAllBadges();
  } catch (err) {
    console.warn('Error during cloud user sync:', err);
  } finally {
    _isSyncingFromCloud = false;
  }
}

// Handle Realtime incoming profile changes
function handleCloudProfileUpdate(profile) {
  if (!profile) return;
  const cloudCartTime = profile.cart_updated_at ? new Date(profile.cart_updated_at).getTime() : 0;
  const localCartTime = parseInt(localStorage.getItem('nkemmart_cart_time') || '0', 10);

  if (cloudCartTime >= localCartTime) {
    const cloudCart = Array.isArray(profile.cart) ? profile.cart : [];
    _isSyncingFromCloud = true;
    localStorage.setItem('nkemmart_cart', JSON.stringify(cloudCart));
    localStorage.setItem('nkemmart_cart_time', cloudCartTime.toString());
    _isSyncingFromCloud = false;
    if (typeof syncAllBadges === 'function') syncAllBadges();
    window.dispatchEvent(new CustomEvent('nkemmart_cart_synced', { detail: { cart: cloudCart } }));
  }

  const cloudSavedTime = profile.saved_updated_at ? new Date(profile.saved_updated_at).getTime() : 0;
  const localSavedTime = parseInt(localStorage.getItem('nkemmart_saved_time') || '0', 10);

  if (cloudSavedTime >= localSavedTime) {
    const cloudSaved = Array.isArray(profile.saved_items) ? profile.saved_items : [];
    _isSyncingFromCloud = true;
    localStorage.setItem('nkemmart_saved_items', JSON.stringify(cloudSaved));
    localStorage.setItem('nkemmart_saved_time', cloudSavedTime.toString());
    _isSyncingFromCloud = false;
    if (typeof syncAllBadges === 'function') syncAllBadges();
    window.dispatchEvent(new CustomEvent('nkemmart_saved_synced', { detail: { saved_items: cloudSaved } }));
  }

  if (typeof updateSiteAccountMenu === 'function') {
    updateSiteAccountMenu();
  }
}

// Realtime cross-device channel subscriber
async function setupRealtimeSync() {
  try {
    const client = getSupabase();
    if (!client) return;
    const user = await getCurrentUser();
    if (!user) return;

    localStorage.setItem('nkemmart_last_authed_user', user.id);

    if (realtimeChannel) {
      try { client.removeChannel(realtimeChannel); } catch (e) {}
      realtimeChannel = null;
    }

    realtimeChannel = client
      .channel('user-realtime-' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload && payload.new) {
            handleCloudProfileUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload && payload.new) {
            window.dispatchEvent(new CustomEvent('nkemmart_activity_logged', { detail: payload.new }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload && payload.new) {
            window.dispatchEvent(new CustomEvent('nkemmart_order_updated', { detail: payload.new }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncUserDataWithSupabase();
        }
      });
  } catch (err) {
    console.warn('Realtime sync setup notice:', err);
  }
}

// Background Auto-sync Interceptor for LocalStorage
(function setupCloudAutoSyncInterceptor() {
  if (typeof window === 'undefined') return;

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  let cartSyncTimer = null;
  let savedSyncTimer = null;

  localStorage.setItem = function(key, value) {
    originalSetItem(key, value);

    if (_isSyncingFromCloud) return;

    if (key === 'nkemmart_cart') {
      const now = Date.now();
      originalSetItem('nkemmart_cart_time', now.toString());
      clearTimeout(cartSyncTimer);
      cartSyncTimer = setTimeout(async () => {
        try {
          const client = getSupabase();
          if (!client) return;
          const user = await getCurrentUser();
          if (!user) return;
          const parsed = JSON.parse(value || '[]');
          await client.from('profiles').update({
            cart: parsed,
            cart_updated_at: new Date(now).toISOString(),
            last_active_at: new Date().toISOString()
          }).eq('id', user.id);

          const title = parsed.length > 0 ? ('Updated shopping cart (' + parsed.length + ' item' + (parsed.length > 1 ? 's' : '') + ')') : 'Cleared shopping cart';
          logUserActivity('cart_update', title, { count: parsed.length });
        } catch (e) {}
      }, 200);
    }

    if (key === 'nkemmart_saved_items') {
      const now = Date.now();
      originalSetItem('nkemmart_saved_time', now.toString());
      clearTimeout(savedSyncTimer);
      savedSyncTimer = setTimeout(async () => {
        try {
          const client = getSupabase();
          if (!client) return;
          const user = await getCurrentUser();
          if (!user) return;
          const parsed = JSON.parse(value || '[]');
          await client.from('profiles').update({
            saved_items: parsed,
            saved_updated_at: new Date(now).toISOString(),
            last_active_at: new Date().toISOString()
          }).eq('id', user.id);

          const title = parsed.length > 0 ? ('Updated saved items (' + parsed.length + ' item' + (parsed.length > 1 ? 's' : '') + ')') : 'Cleared saved items';
          logUserActivity('saved_update', title, { count: parsed.length });
        } catch (e) {}
      }, 200);
    }
  };

  localStorage.removeItem = function(key) {
    originalRemoveItem(key);

    if (_isSyncingFromCloud) return;

    if (key === 'nkemmart_cart') {
      const now = Date.now();
      originalSetItem('nkemmart_cart_time', now.toString());
      clearTimeout(cartSyncTimer);
      cartSyncTimer = setTimeout(async () => {
        try {
          const client = getSupabase();
          if (!client) return;
          const user = await getCurrentUser();
          if (!user) return;
          await client.from('profiles').update({
            cart: [],
            cart_updated_at: new Date(now).toISOString(),
            last_active_at: new Date().toISOString()
          }).eq('id', user.id);

          logUserActivity('cart_update', 'Cleared shopping cart', { count: 0 });
        } catch (e) {}
      }, 100);
    }

    if (key === 'nkemmart_saved_items') {
      const now = Date.now();
      originalSetItem('nkemmart_saved_time', now.toString());
      clearTimeout(savedSyncTimer);
      savedSyncTimer = setTimeout(async () => {
        try {
          const client = getSupabase();
          if (!client) return;
          const user = await getCurrentUser();
          if (!user) return;
          await client.from('profiles').update({
            saved_items: [],
            saved_updated_at: new Date(now).toISOString(),
            last_active_at: new Date().toISOString()
          }).eq('id', user.id);

          logUserActivity('saved_update', 'Cleared saved items', { count: 0 });
        } catch (e) {}
      }, 100);
    }
  };
})();

async function signOutUser() {
  const client = getSupabase();
  if (realtimeChannel && client) {
    try { client.removeChannel(realtimeChannel); } catch (e) {}
    realtimeChannel = null;
  }
  try {
    if (typeof logUserActivity === 'function') {
      await logUserActivity('logout', 'Signed out of account');
    }
  } catch (e) {}
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) console.error('Sign out error:', error);
  localStorage.removeItem('nkemmart_last_authed_user');
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

// Global Account Modal Manager
window.openAccountModal = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

  let overlay = document.getElementById('siteAccountModalOverlay');
  if (!overlay && typeof updateSiteAccountMenu === 'function') {
    updateSiteAccountMenu();
    overlay = document.getElementById('siteAccountModalOverlay');
  }
  if (overlay) {
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    if (document.documentElement) document.documentElement.classList.add('modal-open');
  }
};

window.closeAccountModal = function() {
  const overlay = document.getElementById('siteAccountModalOverlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
  document.body.classList.remove('modal-open');
  if (document.documentElement) document.documentElement.classList.remove('modal-open');
};

// Delegated click handler so clicking ANY account trigger on any page opens the modal cleanly
if (!window._accountModalClickDelegated) {
  window._accountModalClickDelegated = true;
  document.addEventListener('click', (e) => {
    const accountBtn = e.target.closest('#accountMenuBtn, .account-btn-header, .header-actions .action-item:first-child .action-btn, [data-account-modal-trigger]');
    if (accountBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.openAccountModal(e);
    }
  });
}

// Global Auth UI Bar Update Helper (updates Account Modal & header state across site)
async function updateSiteAccountMenu() {
  try {
    const profile = await getCurrentProfile();
    const accountButtons = document.querySelectorAll('#accountMenuBtn, .account-btn-header, .header-actions .action-item:first-child .action-btn');
    const accountDropdowns = document.querySelectorAll('#accountMenu, .account-dropdown-menu');

    // Ensure site account modal overlay container exists
    let modalOverlay = document.getElementById('siteAccountModalOverlay');
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'siteAccountModalOverlay';
      modalOverlay.className = 'site-account-modal-overlay';
      modalOverlay.setAttribute('role', 'dialog');
      modalOverlay.setAttribute('aria-modal', 'true');
      modalOverlay.setAttribute('aria-label', 'My Account');
      document.body.appendChild(modalOverlay);
    }

    if (profile) {
      // Sync cloud cart and saved items with local storage
      if (typeof syncUserDataWithSupabase === 'function') {
        syncUserDataWithSupabase();
      }

      accountButtons.forEach(btn => {
        const textSpan = btn.querySelector('span:not(.chevron-icon)');
        if (textSpan) {
          const firstName = profile.full_name ? profile.full_name.trim().split(' ')[0] : 'Account';
          textSpan.textContent = firstName.length > 10 ? firstName.substring(0, 9) + '...' : firstName;
        }
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.onclick = (e) => window.openAccountModal(e);
      });

      const initialChar = profile.full_name ? profile.full_name.trim().charAt(0).toUpperCase() : 'U';
      const roleClass = profile.role === 'admin' ? 'admin' : 'customer';
      const roleText = profile.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
      const locationText = profile.state ? ((profile.lga ? profile.lga + ', ' : '') + profile.state) : '';

      let adminLinkHtml = '';
      if (profile.role === 'admin') {
        adminLinkHtml = `
          <a href="admin.html" class="site-account-modal-link">
            <span class="site-account-modal-link-icon" style="color: #15803d; background: #f0fdf4;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </span>
            <div class="site-account-modal-link-content">
              <div class="site-account-modal-link-title" style="color: #15803d;">Admin Portal</div>
              <div class="site-account-modal-link-sub">Manage products, inventory &amp; orders</div>
            </div>
            <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        `;
      }

      modalOverlay.innerHTML = `
        <div class="site-account-modal-dialog">
          <div class="site-account-modal-header">
            <h3 class="site-account-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>My Account</span>
            </h3>
            <button type="button" class="site-account-modal-close" aria-label="Close Account Dialog" onclick="window.closeAccountModal();">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="site-account-modal-body">
            <a href="profile.html" class="site-account-modal-profile-card" title="Click to view/edit profile">
              <div class="site-account-modal-avatar">${escapeHtml(initialChar)}</div>
              <div class="site-account-modal-profile-info">
                <div class="site-account-modal-profile-name">${escapeHtml(profile.full_name)}</div>
                <div class="site-account-modal-profile-email">${escapeHtml(profile.email)}</div>
                <div class="site-account-modal-profile-badges">
                  <span class="site-account-badge-role ${roleClass}">${roleText}</span>
                  ${locationText ? `<span class="site-account-badge-loc">${escapeHtml(locationText)}</span>` : ''}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2.5" style="flex-shrink: 0;"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>

            <div class="site-account-modal-nav">
              <a href="profile.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Edit Profile &amp; Info</div>
                  <div class="site-account-modal-link-sub">Manage phone number, state, LGA &amp; security</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              <a href="activities.html" class="site-account-modal-link ${window.location.pathname.includes('activities.html') ? 'active-link' : ''}">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Activity History</div>
                  <div class="site-account-modal-link-sub">Audit trail, real-time live sync, filters &amp; sorting</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              ${adminLinkHtml}

              <a href="orders.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">My Orders</div>
                  <div class="site-account-modal-link-sub">Track delivery progress &amp; order receipts</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              <a href="saved-items.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Saved Items</div>
                  <div class="site-account-modal-link-sub">Wishlist &amp; products saved for later</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              <a href="cart.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Shopping Cart</div>
                  <div class="site-account-modal-link-sub">Review items &amp; proceed to secure checkout</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              <a href="help.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Help &amp; Customer Care</div>
                  <div class="site-account-modal-link-sub">Delivery questions, FAQs &amp; WhatsApp support</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>
            </div>
          </div>

          <div class="site-account-modal-footer">
            <button type="button" class="site-account-modal-signout-btn" id="modalSignOutBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      `;

      const signOutBtn = modalOverlay.querySelector('#modalSignOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await signOutUser();
          window.location.reload();
        });
      }

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
    } else {
      // User is logged out
      accountButtons.forEach(btn => {
        const textSpan = btn.querySelector('span:not(.chevron-icon)');
        if (textSpan) {
          textSpan.textContent = 'Account';
        }
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.onclick = (e) => window.openAccountModal(e);
      });

      modalOverlay.innerHTML = `
        <div class="site-account-modal-dialog">
          <div class="site-account-modal-header">
            <h3 class="site-account-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Welcome to Ralphmart</span>
            </h3>
            <button type="button" class="site-account-modal-close" aria-label="Close Account Dialog" onclick="window.closeAccountModal();">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="site-account-modal-body">
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 18px 16px; text-align: center; margin-bottom: 16px;">
              <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #091e3a;">Sign in to your account</h4>
              <p style="margin: 0 0 14px 0; font-size: 12.5px; color: #64748b; line-height: 1.4;">Access your orders, track deliveries, save favorite products, and view recent activity.</p>
              <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <a href="auth.html" style="background: #512175; color: #ffffff; padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Sign In</a>
                <a href="auth.html?mode=signup" style="background: #ffffff; color: #512175; border: 1.5px solid #512175; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Create Account</a>
              </div>
            </div>

            <div class="site-account-modal-nav">
              <a href="orders.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Track Orders</div>
                  <div class="site-account-modal-link-sub">Check status using order tracking number</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              <a href="cart.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Shopping Cart</div>
                  <div class="site-account-modal-link-sub">Review items added to cart</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>

              <a href="help.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Help Center &amp; Support</div>
                  <div class="site-account-modal-link-sub">Contact customer care &amp; read FAQs</div>
                </div>
                <svg class="site-account-modal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    // Close on overlay backdrop click
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) {
        window.closeAccountModal();
      }
    };

    // Auto-close on link click
    modalOverlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        window.closeAccountModal();
      });
    });

    // Global escape key listener
    if (!window._accountModalEscapeBound) {
      window._accountModalEscapeBound = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          window.closeAccountModal();
        }
      });
    }

    // Keep legacy dropdown hidden and sync if any exist
    accountDropdowns.forEach(menu => {
      menu.style.display = 'none';
    });
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

// Universal Header Dropdown (Account & Help) touch and click toggle
function initHeaderDropdowns() {
  const items = document.querySelectorAll('.header-actions .action-item');
  items.forEach(item => {
    const btn = item.querySelector('.action-btn');
    const menu = item.querySelector('.dropdown-menu, .action-dropdown');
    if (!btn || !menu || btn.dataset.dropdownInit) return;
    btn.dataset.dropdownInit = 'true';

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = item.classList.contains('active') || menu.classList.contains('show');
      
      // Close other action dropdowns first
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherMenu = other.querySelector('.dropdown-menu, .action-dropdown');
          if (otherMenu) otherMenu.classList.remove('show');
          const otherBtn = other.querySelector('.action-btn');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('active');
        menu.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        menu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  if (!window._dropdownGlobalCloseInit) {
    window._dropdownGlobalCloseInit = true;
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.header-actions .action-item')) {
        document.querySelectorAll('.header-actions .action-item').forEach(item => {
          item.classList.remove('active');
          const menu = item.querySelector('.dropdown-menu, .action-dropdown');
          if (menu) menu.classList.remove('show');
          const btn = item.querySelector('.action-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }
}

// Auto update menu, badges, smart header, realtime sync, and back-to-top on DOM load
if (typeof document !== 'undefined') {
  const initAppSync = () => {
    syncAllBadges();
    initSmartHeader();
    initBackToTop();
    initHeaderDropdowns();
    if (typeof setupRealtimeSync === 'function') {
      setupRealtimeSync();
    }
    setTimeout(updateSiteAccountMenu, 300);
    if (typeof window.initModularSelects === 'function') {
      window.initModularSelects();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppSync);
  } else {
    initAppSync();
  }
  window.addEventListener('storage', syncAllBadges);

  // Sync when user returns to tab / unlocks phone
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (typeof syncUserDataWithSupabase === 'function') syncUserDataWithSupabase();
      if (typeof updateSiteAccountMenu === 'function') updateSiteAccountMenu();
    }
  });
  window.addEventListener('focus', () => {
    if (typeof syncUserDataWithSupabase === 'function') syncUserDataWithSupabase();
    if (typeof updateSiteAccountMenu === 'function') updateSiteAccountMenu();
  });
  // Active tab periodic heartbeat sync
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      if (typeof syncUserDataWithSupabase === 'function') syncUserDataWithSupabase();
    }
  }, 12000);
}
