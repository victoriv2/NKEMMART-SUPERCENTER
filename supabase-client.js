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

async function updateUserProfile({ firstName, lastName, phone, state, stateKey, lga, avatar_url }) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client unavailable');

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new Error('You must be signed in to update your profile.');

  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();
  const fullName = (fName && lName ? `${fName} ${lName}` : (fName || lName)).trim();

  const updateFields = {
    updated_at: new Date().toISOString()
  };
  if (firstName !== undefined) updateFields.first_name = fName;
  if (lastName !== undefined) updateFields.last_name = lName;
  if (firstName !== undefined || lastName !== undefined) updateFields.full_name = fullName;
  if (phone !== undefined) updateFields.phone = (phone || '').trim();
  if (state !== undefined) updateFields.state = (state || '').trim();
  if (stateKey !== undefined) updateFields.state_key = (stateKey || '').trim();
  if (lga !== undefined) updateFields.lga = (lga || '').trim();
  if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;

  // 1. Update public.profiles table in Supabase
  const { data: updatedProfile, error: profileError } = await client
    .from('profiles')
    .update(updateFields)
    .eq('id', user.id);

  if (profileError) {
    console.warn('Profile table update error:', profileError);
    throw profileError;
  }

  // 2. Update auth user metadata
  try {
    const metaUpdates = { ...updateFields };
    delete metaUpdates.updated_at;
    await client.auth.updateUser({
      data: metaUpdates
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

// Fetch Product Reviews from Cloud Supabase
async function getProductReviews(productId) {
  if (!productId) return [];
  try {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client
        .from('product_reviews')
        .select('*')
        .eq('product_id', String(productId))
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        try {
          localStorage.setItem('nkemmart_cached_reviews_' + productId, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('Error fetching cloud product reviews:', err);
  }

  // Fallback to cached reviews
  try {
    const cached = localStorage.getItem('nkemmart_cached_reviews_' + productId);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return [];
}

// Submit Product Review to Cloud Supabase
async function submitProductReview({ productId, productTitle, productImage, rating, comment, reviewerName }) {
  if (!productId || !comment) {
    throw new Error('Product ID and review comment are required.');
  }

  const client = getSupabase();
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
  const finalName = (reviewerName || '').trim() || (profile ? profile.full_name : '') || (user ? user.email.split('@')[0] : 'Verified Customer');
  const userEmail = (user && user.email) || (profile && profile.email) || null;
  const userId = (user && user.id) || null;

  const reviewPayload = {
    product_id: String(productId),
    product_title: (productTitle || '').trim(),
    product_image: (productImage || '').trim(),
    user_id: userId,
    user_email: userEmail,
    reviewer_name: finalName,
    rating: numRating,
    comment: comment.trim(),
    verified_purchase: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedReview = null;

  if (client) {
    try {
      const { data, error } = await client
        .from('product_reviews')
        .insert([reviewPayload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert review note:', error.message);
      } else if (data) {
        savedReview = data;
      }
    } catch (insertErr) {
      console.warn('Failed cloud insert for review:', insertErr);
    }
  }

  if (!savedReview) {
    savedReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      ...reviewPayload
    };
  }

  // Update local caches
  try {
    const prodCacheKey = 'nkemmart_cached_reviews_' + productId;
    const existingProd = JSON.parse(localStorage.getItem(prodCacheKey) || '[]');
    existingProd.unshift(savedReview);
    localStorage.setItem(prodCacheKey, JSON.stringify(existingProd));

    if (userId || userEmail) {
      const userKey = 'nkemmart_user_reviews_' + (userId || userEmail);
      const existingUser = JSON.parse(localStorage.getItem(userKey) || '[]');
      existingUser.unshift(savedReview);
      localStorage.setItem(userKey, JSON.stringify(existingUser));
    }
  } catch (e) {}

  // Log user activity
  try {
    if (typeof logUserActivity === 'function' && userId) {
      await logUserActivity(
        'review_submitted',
        `Rated & reviewed ${productTitle || 'product'} (${numRating} stars)`,
        {
          productId: String(productId),
          productTitle: productTitle || '',
          rating: numRating,
          reviewId: savedReview.id
        }
      );
    }
  } catch (actErr) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_review_added', { detail: savedReview }));
    window.dispatchEvent(new CustomEvent('nkemmart_review_updated', { detail: savedReview }));
  }

  return savedReview;
}

// Fetch all reviews submitted by the current user
async function getUserReviews() {
  try {
    const client = getSupabase();
    const user = await getCurrentUser();
    if (!user) {
      const guestReviews = localStorage.getItem('nkemmart_user_reviews_guest');
      return guestReviews ? JSON.parse(guestReviews) : [];
    }

    if (client) {
      const { data, error } = await client
        .from('product_reviews')
        .select('*')
        .or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        try {
          localStorage.setItem('nkemmart_user_reviews_' + user.id, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }

    const cached = localStorage.getItem('nkemmart_user_reviews_' + user.id);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('Error fetching user reviews:', err);
  }
  return [];
}

// Fetch all reviews for store admin / management
async function getAllReviewsForAdmin() {
  try {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching admin reviews:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error in getAllReviewsForAdmin:', err);
    return [];
  }
}

// Reply to a product review (for Admin / Store Owner)
async function adminReplyToReview(reviewId, replyText) {
  if (!reviewId || !replyText) throw new Error('Review ID and reply text are required.');
  const client = getSupabase();
  if (!client) throw new Error('Database client unavailable');

  const replyPayload = {
    admin_reply: replyText.trim(),
    admin_reply_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('product_reviews')
    .update(replyPayload)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_review_updated', { detail: data }));
  }

  return data;
}

// ==========================================
// 1. SAVED ADDRESS BOOK MANAGEMENT
// ==========================================
async function getUserAddresses() {
  try {
    const client = getSupabase();
    const user = await getCurrentUser();
    let localAddresses = [];
    try {
      localAddresses = JSON.parse(localStorage.getItem('nkemmart_user_addresses') || '[]');
    } catch (e) {}

    if (client && user) {
      const { data: profile } = await client
        .from('profiles')
        .select('addresses, state, state_key, lga, full_name, phone')
        .eq('id', user.id)
        .single();

      if (profile && Array.isArray(profile.addresses) && profile.addresses.length > 0) {
        localStorage.setItem('nkemmart_user_addresses', JSON.stringify(profile.addresses));
        return profile.addresses;
      }

      // If user has primary profile state/LGA but no saved addresses yet, seed a default "Home" address
      if (profile && profile.state_key && localAddresses.length === 0) {
        const defaultAddr = {
          id: 'addr_default_' + user.id.substring(0, 8),
          label: 'Home',
          full_name: profile.full_name || 'Primary Recipient',
          phone: profile.phone || '',
          street: profile.lga ? (profile.lga + ', Nigeria') : 'Doorstep Delivery',
          state_key: profile.state_key,
          state_name: profile.state || profile.state_key,
          lga: profile.lga || '',
          is_default: true,
          created_at: new Date().toISOString()
        };
        const initialList = [defaultAddr];
        localStorage.setItem('nkemmart_user_addresses', JSON.stringify(initialList));
        await client.from('profiles').update({ addresses: initialList }).eq('id', user.id);
        return initialList;
      }
    }
    return localAddresses;
  } catch (err) {
    console.warn('Error fetching addresses:', err);
    try {
      return JSON.parse(localStorage.getItem('nkemmart_user_addresses') || '[]');
    } catch (e) {
      return [];
    }
  }
}

async function saveUserAddress(addressObj) {
  if (!addressObj || !addressObj.state_key) throw new Error('State and delivery details are required.');
  const user = await getCurrentUser();
  const client = getSupabase();

  let addresses = await getUserAddresses();
  const addrId = addressObj.id || ('addr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

  const cleanAddr = {
    id: addrId,
    label: (addressObj.label || 'Home').trim(),
    full_name: (addressObj.full_name || '').trim(),
    phone: (addressObj.phone || '').trim(),
    street: (addressObj.street || '').trim(),
    state_key: (addressObj.state_key || '').trim(),
    state_name: (addressObj.state_name || addressObj.state || '').trim(),
    lga: (addressObj.lga || addressObj.city || '').trim(),
    is_default: Boolean(addressObj.is_default),
    updated_at: new Date().toISOString()
  };

  if (cleanAddr.is_default || addresses.length === 0) {
    cleanAddr.is_default = true;
    addresses.forEach(a => { a.is_default = false; });
  }

  const existingIdx = addresses.findIndex(a => a.id === addrId);
  if (existingIdx >= 0) {
    addresses[existingIdx] = cleanAddr;
  } else {
    addresses.unshift(cleanAddr);
  }

  localStorage.setItem('nkemmart_user_addresses', JSON.stringify(addresses));

  if (client && user) {
    await client.from('profiles').update({ addresses: addresses, updated_at: new Date().toISOString() }).eq('id', user.id);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_address_updated', { detail: { addresses } }));
  }

  return cleanAddr;
}

async function deleteUserAddress(addressId) {
  if (!addressId) return;
  const user = await getCurrentUser();
  const client = getSupabase();

  let addresses = await getUserAddresses();
  addresses = addresses.filter(a => a.id !== addressId);
  if (addresses.length > 0 && !addresses.some(a => a.is_default)) {
    addresses[0].is_default = true;
  }

  localStorage.setItem('nkemmart_user_addresses', JSON.stringify(addresses));

  if (client && user) {
    await client.from('profiles').update({ addresses: addresses }).eq('id', user.id);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_address_updated', { detail: { addresses } }));
  }
}

async function setDefaultUserAddress(addressId) {
  if (!addressId) return;
  const user = await getCurrentUser();
  const client = getSupabase();

  let addresses = await getUserAddresses();
  addresses.forEach(a => { a.is_default = (a.id === addressId); });

  localStorage.setItem('nkemmart_user_addresses', JSON.stringify(addresses));

  if (client && user) {
    await client.from('profiles').update({ addresses: addresses }).eq('id', user.id);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_address_updated', { detail: { addresses } }));
  }
}

// ==========================================
// 2. IN-APP NOTIFICATION INBOX & REAL-TIME ALERTS
// ==========================================
async function getUserNotifications() {
  try {
    const client = getSupabase();
    const user = await getCurrentUser();
    let localNotifs = [];
    try {
      localNotifs = JSON.parse(localStorage.getItem('nkemmart_user_notifications') || '[]');
    } catch (e) {}

    if (client && user) {
      const { data: profile } = await client
        .from('profiles')
        .select('notifications')
        .eq('id', user.id)
        .single();

      if (profile && Array.isArray(profile.notifications) && profile.notifications.length > 0) {
        localStorage.setItem('nkemmart_user_notifications', JSON.stringify(profile.notifications));
        return profile.notifications;
      }
    }

    if (localNotifs.length === 0) {
      const welcome = {
        id: 'notif_welcome',
        type: 'system',
        title: 'Welcome to Ralphmart Supercenter',
        message: 'Genuine products, real-time dispatch across all 36 states and FCT in Nigeria.',
        link: 'index.html',
        is_read: false,
        created_at: new Date().toISOString()
      };
      localNotifs = [welcome];
      localStorage.setItem('nkemmart_user_notifications', JSON.stringify(localNotifs));
    }

    return localNotifs;
  } catch (err) {
    console.warn('Error fetching notifications:', err);
    try {
      return JSON.parse(localStorage.getItem('nkemmart_user_notifications') || '[]');
    } catch (e) {
      return [];
    }
  }
}

async function addUserNotification({ type, title, message, link }) {
  if (!title) return;
  const notif = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: type || 'order',
    title: title.trim(),
    message: (message || '').trim(),
    link: link || 'orders.html',
    is_read: false,
    created_at: new Date().toISOString()
  };

  let notifs = [];
  try {
    notifs = JSON.parse(localStorage.getItem('nkemmart_user_notifications') || '[]');
  } catch (e) {}

  notifs.unshift(notif);
  if (notifs.length > 50) notifs = notifs.slice(0, 50);
  localStorage.setItem('nkemmart_user_notifications', JSON.stringify(notifs));

  const client = getSupabase();
  const user = await getCurrentUser();
  if (client && user) {
    try {
      await client.from('profiles').update({ notifications: notifs }).eq('id', user.id);
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_notification_received', { detail: notif }));
    updateNotificationBadges();
  }
  return notif;
}

async function markNotificationAsRead(notifId) {
  let notifs = [];
  try {
    notifs = JSON.parse(localStorage.getItem('nkemmart_user_notifications') || '[]');
  } catch (e) {}

  notifs.forEach(n => {
    if (n.id === notifId) n.is_read = true;
  });

  localStorage.setItem('nkemmart_user_notifications', JSON.stringify(notifs));

  const client = getSupabase();
  const user = await getCurrentUser();
  if (client && user) {
    try {
      await client.from('profiles').update({ notifications: notifs }).eq('id', user.id);
    } catch (e) {}
  }

  updateNotificationBadges();
}

async function markAllNotificationsAsRead() {
  let notifs = [];
  try {
    notifs = JSON.parse(localStorage.getItem('nkemmart_user_notifications') || '[]');
  } catch (e) {}

  notifs.forEach(n => { n.is_read = true; });
  localStorage.setItem('nkemmart_user_notifications', JSON.stringify(notifs));

  const client = getSupabase();
  const user = await getCurrentUser();
  if (client && user) {
    try {
      await client.from('profiles').update({ notifications: notifs }).eq('id', user.id);
    } catch (e) {}
  }

  updateNotificationBadges();
}

function updateNotificationBadges() {
  let notifs = [];
  try {
    notifs = JSON.parse(localStorage.getItem('nkemmart_user_notifications') || '[]');
  } catch (e) {}

  const unreadCount = notifs.filter(n => !n.is_read).length;
  const badges = document.querySelectorAll('.header-notif-badge');
  badges.forEach(b => {
    if (unreadCount > 0) {
      b.style.display = 'inline-flex';
      b.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      b.style.display = 'none';
    }
  });
}

function initGlobalNotificationCenter() {
  if (typeof document === 'undefined') return;
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions || document.getElementById('headerNotifWrap')) return;

  const notifWrap = document.createElement('div');
  notifWrap.className = 'action-item header-notif-wrap';
  notifWrap.id = 'headerNotifWrap';
  notifWrap.style.position = 'relative';

  notifWrap.innerHTML = `
    <button type="button" class="action-btn" id="headerNotifBtn" title="Notifications" aria-haspopup="dialog" aria-expanded="false">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="action-label">Alerts</span>
      <span class="badge header-notif-badge" id="headerNotifBadge" style="display: none; background-color: #ef4444;">0</span>
    </button>
    <div class="header-notif-tray" id="headerNotifTray" style="display: none;">
      <div class="notif-tray-header">
        <div style="font-weight: 800; font-size: 14px; color: #0f172a; display: flex; align-items: center; gap: 6px;">
          <span>Notifications</span>
          <span class="notif-tray-count-pill" id="notifTrayCountPill">0 Unread</span>
        </div>
        <button type="button" class="notif-mark-all-btn" id="notifMarkAllReadBtn">Mark all as read</button>
      </div>
      <div class="notif-tray-list" id="notifTrayList">
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 12.5px;">Loading alerts...</div>
      </div>
      <div class="notif-tray-footer">
        <a href="activities.html" style="font-size: 12px; font-weight: 700; color: #512175; text-decoration: none;">View Full Activity Audit Trail &rarr;</a>
      </div>
    </div>
  `;

  headerActions.insertBefore(notifWrap, headerActions.firstChild);

  const notifBtn = notifWrap.querySelector('#headerNotifBtn');
  const notifTray = notifWrap.querySelector('#headerNotifTray');
  const markAllBtn = notifWrap.querySelector('#notifMarkAllReadBtn');

  async function renderNotifTray() {
    const listEl = notifWrap.querySelector('#notifTrayList');
    const pill = notifWrap.querySelector('#notifTrayCountPill');
    const notifs = await getUserNotifications();
    const unread = notifs.filter(n => !n.is_read).length;
    if (pill) pill.textContent = unread + ' Unread';

    if (notifs.length === 0) {
      listEl.innerHTML = '<div style="text-align: center; padding: 28px 16px; color: #64748b; font-size: 13px;">No notifications yet. Alerts about orders, price drops, and replies will show here.</div>';
      return;
    }

    listEl.innerHTML = notifs.slice(0, 15).map(n => {
      let icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
      if (n.type === 'order') {
        icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
      } else if (n.type === 'review') {
        icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
      }

      const timeAgo = formatNotifTime(n.created_at);
      return `
        <a href="${n.link || 'orders.html'}" class="notif-tray-item ${n.is_read ? 'read' : 'unread'}" onclick="markNotificationAsRead('${n.id}')">
          <div class="notif-item-icon">${icon}</div>
          <div class="notif-item-content">
            <div class="notif-item-title">${escapeNotifHtml(n.title)}</div>
            <div class="notif-item-sub">${escapeNotifHtml(n.message)}</div>
            <div class="notif-item-time">${timeAgo}</div>
          </div>
          ${!n.is_read ? '<span class="notif-item-dot"></span>' : ''}
        </a>
      `;
    }).join('');
  }

  function formatNotifTime(iso) {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      const diffMin = Math.floor((new Date() - d) / 60000);
      if (diffMin < 2) return 'Just now';
      if (diffMin < 60) return diffMin + 'm ago';
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return diffH + 'h ago';
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    } catch (e) { return 'Recent'; }
  }

  function escapeNotifHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = notifTray.style.display === 'block';
    document.querySelectorAll('.dropdown-menu, .site-account-modal-overlay').forEach(el => el.classList.remove('open'));
    if (isOpen) {
      notifTray.style.display = 'none';
      notifBtn.setAttribute('aria-expanded', 'false');
    } else {
      notifTray.style.display = 'block';
      notifBtn.setAttribute('aria-expanded', 'true');
      renderNotifTray();
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await markAllNotificationsAsRead();
      renderNotifTray();
    });
  }

  document.addEventListener('click', (e) => {
    if (!notifWrap.contains(e.target)) {
      notifTray.style.display = 'none';
      notifBtn.setAttribute('aria-expanded', 'false');
    }
  });

  updateNotificationBadges();
}

// ==========================================
// 3. RECENTLY VIEWED PRODUCTS TRACKER
// ==========================================
function trackRecentlyViewedProduct(product) {
  if (!product || !product.id) return;
  try {
    let list = JSON.parse(localStorage.getItem('nkemmart_recently_viewed') || '[]');
    list = list.filter(p => p.id !== product.id);
    list.unshift({
      id: product.id,
      title: product.title || 'Product',
      price: product.price || 0,
      old_price: product.old_price || product.oldPrice || null,
      image: (product.images && product.images[0]) || product.image || 'images/subcategories/sub_smartphones.jpg',
      brand: product.brand || '',
      category: product.category || product.category_id || '',
      viewed_at: Date.now()
    });
    if (list.length > 15) list = list.slice(0, 15);
    localStorage.setItem('nkemmart_recently_viewed', JSON.stringify(list));

    getCurrentUser().then(user => {
      if (user) {
        const client = getSupabase();
        if (client) client.from('profiles').update({ recently_viewed: list }).eq('id', user.id).then(() => {}).catch(() => {});
      }
    });
  } catch (e) {}
}

function getRecentlyViewedProducts() {
  try {
    return JSON.parse(localStorage.getItem('nkemmart_recently_viewed') || '[]');
  } catch (e) { return []; }
}

function renderRecentlyViewedShelf(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const list = getRecentlyViewedProducts();
  if (!list || list.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div style="margin: 36px 0 20px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #0f172a;">Recently Viewed Products</h3>
        </div>
        <a href="category.html" style="font-size: 13px; font-weight: 700; color: #512175; text-decoration: none;">Explore More Products &rarr;</a>
      </div>
      <div class="recently-viewed-scroll-track" style="display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: thin;">
        ${list.map(p => `
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="recently-viewed-card" style="flex: 0 0 160px; text-decoration: none; border: 1px solid #f1f5f9; border-radius: 10px; padding: 12px; background: #ffffff; display: flex; flex-direction: column; transition: transform 0.15s, border-color 0.15s;" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#f1f5f9'">
            <div style="width: 100%; height: 110px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; margin-bottom: 8px;">
              <img src="${p.image}" alt="${p.title}" style="max-width: 100%; max-height: 100px; object-fit: contain;">
            </div>
            <span style="font-size: 12px; color: #64748b; margin-bottom: 2px;">${p.brand || 'Ralphmart'}</span>
            <span style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; height: 34px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 6px;">${p.title}</span>
            <span style="font-size: 14px; font-weight: 800; color: #512175; margin-top: auto;">₦${Number(p.price || 0).toLocaleString()}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// 4. ORDER LIFECYCLE (CANCEL, REORDER, RETURN)
// ==========================================
async function cancelOrder(orderId, reason) {
  if (!orderId) throw new Error('Order ID required.');
  const client = getSupabase();
  const now = new Date().toISOString();

  if (client) {
    const { error } = await client
      .from('orders')
      .update({
        order_status: 'cancelled',
        cancellation_reason: (reason || 'Cancelled by customer').trim(),
        cancelled_at: now,
        updated_at: now
      })
      .eq('id', orderId);
    if (error) throw error;
  }

  try {
    const orders = JSON.parse(localStorage.getItem('nkemmart_user_orders') || '[]');
    const target = orders.find(o => o.id === orderId);
    if (target) {
      target.order_status = 'cancelled';
      target.cancellation_reason = reason;
      target.cancelled_at = now;
      localStorage.setItem('nkemmart_user_orders', JSON.stringify(orders));
    }
  } catch (e) {}

  try {
    if (typeof logUserActivity === 'function') {
      logUserActivity('order_cancelled', 'Cancelled order #' + orderId, { orderId, reason });
    }
    await addUserNotification({
      type: 'order',
      title: 'Order Cancelled',
      message: 'Your order #' + orderId + ' has been cancelled as requested.',
      link: 'orders.html?orderId=' + orderId
    });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_order_updated', { detail: { id: orderId, status: 'cancelled' } }));
  }
}

async function requestOrderReturn(orderId, reason) {
  if (!orderId) throw new Error('Order ID required.');
  const client = getSupabase();
  const now = new Date().toISOString();

  if (client) {
    const { error } = await client
      .from('orders')
      .update({
        return_status: 'requested',
        return_reason: (reason || 'Customer requested return').trim(),
        return_requested_at: now,
        updated_at: now
      })
      .eq('id', orderId);
    if (error) throw error;
  }

  try {
    const orders = JSON.parse(localStorage.getItem('nkemmart_user_orders') || '[]');
    const target = orders.find(o => o.id === orderId);
    if (target) {
      target.return_status = 'requested';
      target.return_reason = reason;
      target.return_requested_at = now;
      localStorage.setItem('nkemmart_user_orders', JSON.stringify(orders));
    }
  } catch (e) {}

  try {
    if (typeof logUserActivity === 'function') {
      logUserActivity('return_requested', 'Requested return for order #' + orderId, { orderId, reason });
    }
    await addUserNotification({
      type: 'order',
      title: 'Return Request Received',
      message: 'Your return request for order #' + orderId + ' has been submitted for store review.',
      link: 'orders.html?orderId=' + orderId
    });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nkemmart_order_updated', { detail: { id: orderId, return_status: 'requested' } }));
  }
}

async function reorderOrderItems(orderId) {
  if (!orderId) return;
  let items = [];
  try {
    const orders = JSON.parse(localStorage.getItem('nkemmart_user_orders') || '[]');
    const target = orders.find(o => o.id === orderId);
    if (target && Array.isArray(target.items)) {
      items = target.items;
    }
  } catch (e) {}

  if (items.length === 0) {
    const client = getSupabase();
    if (client) {
      const { data } = await client.from('orders').select('items').eq('id', orderId).single();
      if (data && Array.isArray(data.items)) items = data.items;
    }
  }

  if (items.length === 0) throw new Error('Could not find items to reorder.');

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('nkemmart_cart') || '[]'); } catch (e) {}
  const cartMap = new Map();
  cart.forEach(it => { if (it && it.id) cartMap.set(String(it.id), it); });

  items.forEach(it => {
    if (it && it.id) {
      const key = String(it.id);
      if (cartMap.has(key)) {
        cartMap.get(key).qty = (cartMap.get(key).qty || 1) + (it.qty || 1);
      } else {
        cartMap.set(key, { ...it });
      }
    }
  });

  const finalCart = Array.from(cartMap.values());
  if (typeof syncCartToCloud === 'function') {
    await syncCartToCloud(finalCart);
  } else {
    localStorage.setItem('nkemmart_cart', JSON.stringify(finalCart));
    if (typeof syncAllBadges === 'function') syncAllBadges();
  }

  return finalCart;
}

// ==========================================
// 5. LIVE PREDICTIVE INSTANT SEARCH
// ==========================================
function initLivePredictiveSearch() {
  if (typeof document === 'undefined') return;
  const searchInputs = document.querySelectorAll('.search-input');
  searchInputs.forEach(input => {
    if (input.getAttribute('data-predictive-ready')) return;
    input.setAttribute('data-predictive-ready', 'true');

    const form = input.closest('form') || input.parentElement;
    form.style.position = 'relative';

    const menu = document.createElement('div');
    menu.className = 'predictive-search-menu';
    menu.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);
      z-index: 99999;
      display: none;
      max-height: 420px;
      overflow-y: auto;
      margin-top: 2px;
    `;
    form.appendChild(menu);

    let debounceTimer = null;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = input.value.trim().toLowerCase();
      if (query.length < 2) {
        menu.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(() => {
        let catalog = [];
        if (typeof RALPHMART_CATALOG !== 'undefined' && Array.isArray(RALPHMART_CATALOG)) {
          catalog = RALPHMART_CATALOG;
        } else if (typeof CATALOG_PRODUCTS !== 'undefined' && Array.isArray(CATALOG_PRODUCTS)) {
          catalog = CATALOG_PRODUCTS;
        }

        const matched = catalog.filter(p => {
          const t = (p.title || '').toLowerCase();
          const b = (p.brand || '').toLowerCase();
          const c = (p.category || p.category_id || '').toLowerCase();
          return t.includes(query) || b.includes(query) || c.includes(query);
        }).slice(0, 6);

        if (matched.length === 0) {
          menu.innerHTML = `
            <div style="padding: 16px; text-align: center; color: #64748b; font-size: 13px;">
              No matching products found for "<strong>${escapeSearchHtml(query)}</strong>"
            </div>
          `;
          menu.style.display = 'block';
          return;
        }

        menu.innerHTML = `
          <div style="padding: 8px 14px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">
            Matching Products (${matched.length})
          </div>
          <div style="display: flex; flex-direction: column;">
            ${matched.map(p => `
              <a href="product.html?id=${encodeURIComponent(p.id)}" class="predictive-search-item" style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; text-decoration: none; border-bottom: 1px solid #f8fafc; transition: background-color 0.15s;" onmouseover="this.style.background='#faf5ff'" onmouseout="this.style.background='transparent'">
                <img src="${(p.images && p.images[0]) || p.image || 'images/subcategories/sub_smartphones.jpg'}" alt="${p.title}" style="width: 42px; height: 42px; object-fit: contain; background: #f8fafc; border-radius: 6px; padding: 2px;">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeSearchHtml(p.title)}</div>
                  <div style="font-size: 11.5px; color: #64748b;">${escapeSearchHtml(p.brand || 'Ralphmart')} &bull; <span style="color: #16a34a; font-weight: 600;">Verified Listing</span></div>
                </div>
                <div style="font-size: 13.5px; font-weight: 800; color: #512175; white-space: nowrap;">₦${Number(p.price || 0).toLocaleString()}</div>
              </a>
            `).join('')}
          </div>
          <a href="category.html?q=${encodeURIComponent(query)}" style="display: block; padding: 10px 14px; background: #faf5ff; text-align: center; font-size: 12.5px; font-weight: 700; color: #512175; text-decoration: none; border-top: 1px solid #e9d5ff;">
            See all results for "${escapeSearchHtml(query)}" &rarr;
          </a>
        `;
        menu.style.display = 'block';
      }, 150);
    });

    document.addEventListener('click', (e) => {
      if (!form.contains(e.target)) {
        menu.style.display = 'none';
      }
    });

    function escapeSearchHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  });
}

// ==========================================
// 6. FLOATING QUICK SUPPORT & WHATSAPP WIDGET
// ==========================================
function initFloatingSupportWidget() {
  if (typeof document === 'undefined' || document.getElementById('floatingSupportWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'floatingSupportWidget';
  widget.className = 'floating-support-container';
  widget.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9998;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `;

  widget.innerHTML = `
    <div class="floating-support-card" id="floatingSupportCard" style="display: none; width: 280px; background: #ffffff; border-radius: 14px; box-shadow: 0 16px 36px rgba(0,0,0,0.18); border: 1px solid #e2e8f0; margin-bottom: 12px; overflow: hidden; animation: notifFadeIn 0.2s ease;">
      <div style="background: linear-gradient(135deg, #512175 0%, #3d1858 100%); color: #ffffff; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></div>
          <div>
            <div style="font-weight: 800; font-size: 13.5px;">Customer Care</div>
            <div style="font-size: 11px; opacity: 0.85;">Live Support Across Nigeria</div>
          </div>
        </div>
        <button type="button" id="closeFloatingCardBtn" style="background: transparent; border: none; color: #ffffff; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      <div style="padding: 12px;">
        <a href="https://wa.me/2347042087633?text=Hello%20Ralphmart%20Support,%20I%20need%20assistance" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-decoration: none; margin-bottom: 8px; transition: background 0.15s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <div>
            <div style="font-weight: 700; font-size: 13px; color: #166534;">Chat on WhatsApp</div>
            <div style="font-size: 11px; color: #15803d;">Instant reply (07042087633)</div>
          </div>
        </a>
        <a href="tel:08155608447" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; margin-bottom: 8px; color: #0f172a;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#512175" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <div>
            <div style="font-weight: 700; font-size: 13px;">Call Support Line</div>
            <div style="font-size: 11px; color: #64748b;">08155608447 (Mon - Sat)</div>
          </div>
        </a>
        <a href="orders.html" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; text-decoration: none; font-size: 12.5px; font-weight: 600; color: #512175;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          <span>Track Delivery Status</span>
        </a>
      </div>
    </div>

    <button type="button" id="floatingSupportTriggerBtn" style="width: 52px; height: 52px; border-radius: 50%; background: #512175; color: #ffffff; border: 2.5px solid #ffffff; box-shadow: 0 8px 24px rgba(81, 33, 117, 0.35); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; transform: none !important;" aria-label="Open support options">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    </button>
  `;

  document.body.appendChild(widget);

  const card = widget.querySelector('#floatingSupportCard');
  const trigger = widget.querySelector('#floatingSupportTriggerBtn');
  const closeBtn = widget.querySelector('#closeFloatingCardBtn');

  trigger.addEventListener('click', () => {
    card.style.display = card.style.display === 'block' ? 'none' : 'block';
  });
  closeBtn.addEventListener('click', () => {
    card.style.display = 'none';
  });
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_reviews'
        },
        (payload) => {
          if (payload && payload.new) {
            window.dispatchEvent(new CustomEvent('nkemmart_review_updated', { detail: payload.new }));
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

              <a href="reviews.html" class="site-account-modal-link ${window.location.pathname.includes('reviews.html') ? 'active-link' : ''}">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #f59e0b;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">My Reviews &amp; Feedback</div>
                  <div class="site-account-modal-link-sub">Track rated products, comments &amp; store replies</div>
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

              <a href="reviews.html" class="site-account-modal-link">
                <span class="site-account-modal-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #f59e0b;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </span>
                <div class="site-account-modal-link-content">
                  <div class="site-account-modal-link-title">Customer Reviews &amp; Ratings</div>
                  <div class="site-account-modal-link-sub">Explore ratings, feedback &amp; store responses</div>
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
    if (typeof initGlobalNotificationCenter === 'function') {
      initGlobalNotificationCenter();
    }
    if (typeof initLivePredictiveSearch === 'function') {
      initLivePredictiveSearch();
    }
    if (typeof initFloatingSupportWidget === 'function') {
      initFloatingSupportWidget();
    }
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
