import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';


// Cache

interface CacheEntry<T> {
  data: T;           // The actual response
  timestamp: number; // When it was cached
  expiresAt: number; // When it becomes stale
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if(!entry) return null;

  const now = Date.now();
  if(entry.expiresAt < now) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function saveToCache<T>(key: string, data:T, ttl: number = CACHE_TTL): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl
  })

  if (cache.size > 100) {
    for (const [key, value] of cache.entries()){
      if(value.expiresAt < now) {
        cache.delete(key)
      }
    }
  }
}


// Rate Limmit


interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 20;

function checkRateLimit(identifier: string) : {allowed: boolean; retryAfter?: number} {
  const now = Date.now()
  const entry = rateLimits.get(identifier)
  if (!entry || entry.resetAt < now) {
    rateLimits.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    })
    return {allowed: true}
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {allowed: false, retryAfter}
  }

  entry.count++;
  return {allowed:true}

}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimits.entries()) {
    if (value.resetAt < now) {
      rateLimits.delete(key);
    }
  }
}, 60000);
 
interface InstagramPost {
  id: string;
  image: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  url: string;
  timestamp: string;
  type: 'image' | 'video' | 'carousel';
}

interface InstagramProfile {
  username: string;
  full_name: string;
  profile_pic: string;
  followers: number;
  following: number;
  posts_count: number;
  bio: string;
  is_private: boolean;
}


async function fetchInstagramPosts(): Promise<{
    profile: InstagramProfile;
    posts: InstagramPost[];
}> {
  // 🎯 STEP 1: Check cache first
  const cacheKey = 'instagram:profile';
  const cacheEntry = cache.get(cacheKey);
  const cached = getFromCache<{ profile: InstagramProfile; posts: InstagramPost[] }>(cacheKey);

  if (cached) {
    const now = Date.now();
    const age = cacheEntry ? Math.floor((now - cacheEntry.timestamp) / 1000) : 0;
    const expiresIn = cacheEntry ? Math.floor((cacheEntry.expiresAt - now) / 1000) : 0;
    
    console.log(`✅ Cache HIT (age: ${age}s, expires in: ${expiresIn}s)`);
    
    // Return without _cache metadata (already cached)
    return cached;
  }

  console.log(`🔄 Cache MISS - Fetching from Facebook Graph API`);

  // 🎯 STEP 2: Cache miss - fetch from Facebook Graph API
  // Get credentials from environment variables
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!pageAccessToken || !instagramBusinessAccountId) {
    throw new Error('Missing Facebook API credentials. Please set FACEBOOK_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID environment variables.');
  }

  // Fetch profile info
  const profileUrl = `https://graph.facebook.com/v25.0/${instagramBusinessAccountId}`;
  const profileParams = new URLSearchParams({
    fields: 'biography,followers_count,follows_count,media_count,name,profile_picture_url,username,website',
    access_token: pageAccessToken
  });

  const profileResponse = await fetch(`${profileUrl}?${profileParams}`, {
    next: { revalidate: 600 }  // Next.js cache: 10 minutes
  });

  if (!profileResponse.ok) {
    const errorData = await profileResponse.json().catch(() => ({}));
    throw new Error(`Facebook Graph API returned ${profileResponse.status}: ${errorData.error?.message || 'Unknown error'}`);
  }

  const profileData = await profileResponse.json();
  
  if (profileData.error) {
    throw new Error(`Facebook Graph API error: ${profileData.error.message}`);
  }

  // Fetch posts
  const postsUrl = `https://graph.facebook.com/v25.0/${instagramBusinessAccountId}/media`;
  const postsParams = new URLSearchParams({
    fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count',
    access_token: pageAccessToken,
    limit: '12'
  });

  const postsResponse = await fetch(`${postsUrl}?${postsParams}`, {
    next: { revalidate: 600 }
  });

  if (!postsResponse.ok) {
    const errorData = await postsResponse.json().catch(() => ({}));
    throw new Error(`Facebook Graph API returned ${postsResponse.status}: ${errorData.error?.message || 'Unknown error'}`);
  }

  const postsData = await postsResponse.json();

  if (postsData.error) {
    throw new Error(`Facebook Graph API error: ${postsData.error.message}`);
  }

  const profile: InstagramProfile = {
    username: profileData.username || '',
    full_name: profileData.name || '',
    profile_pic: profileData.profile_picture_url || '',
    followers: profileData.followers_count || 0,
    following: profileData.follows_count || 0,
    posts_count: profileData.media_count || 0,
    bio: profileData.biography || '',
    is_private: false // Business accounts are always public
  };

  const posts: InstagramPost[] = (postsData.data || []).map((post: {
    id: string;
    caption?: string;
    media_type: string;
    media_url: string;
    permalink: string;
    thumbnail_url?: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
  }) => {
    return {
      id: post.id,
      image: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url,
      thumbnail: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url,
      caption: post.caption || '',
      likes: post.like_count || 0,
      comments: post.comments_count || 0,
      url: post.permalink || '',
      timestamp: post.timestamp || new Date().toISOString(),
      type: post.media_type === 'VIDEO' ? 'video' : post.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image'
    };
  });

  const result = { 
    profile, 
    posts
  };
  
  // 🎯 STEP 3: Cache the successful result
  saveToCache(cacheKey, result);
  console.log(`💾 Cached profile for ${Math.floor(CACHE_TTL / 1000)}s`);
  
  return result;
}



export async function GET(request: NextRequest) {

  // Note: Facebook Graph API can only fetch YOUR OWN Instagram Business Account
  // It cannot fetch other users' profiles like the old unofficial API could

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  const rateLimitResult = checkRateLimit(ip);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        hint: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`
      },
      {
        status: 429, // HTTP 429 = Too Many Requests
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + (rateLimitResult.retryAfter || 60)).toString()
        }
      }
    );
  }

  try {
    const {profile, posts} = await fetchInstagramPosts();

      const currentLimit = rateLimits.get(ip);
    const remaining = RATE_LIMIT_MAX_REQUESTS - (currentLimit?.count || 0);

    return NextResponse.json({success: true,
      profile,
      posts}, {
          headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',  // ← Sending to your users

         // Rate limit info (helps client implement backoff)
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': currentLimit 
        ? Math.floor(currentLimit.resetAt / 1000).toString()
        : Math.floor((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString()
      }
     });

  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Instagram data';
    const isMissingCredentials = message.includes('Missing Facebook API credentials');
    const isApiError = message.includes('Facebook Graph API');
    const isNotFound = message.includes('not found') || message.includes('404');

    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: isMissingCredentials
          ? 'Please configure FACEBOOK_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in your environment variables.'
          : isApiError
            ? 'There was an issue with the Facebook Graph API. Please check your access token and account ID.'
            : isNotFound
              ? 'Account not found. Please check the Instagram Business Account configuration.'
              : 'Make sure your Facebook Page is connected to an Instagram Business Account and your access token is valid.'
      },
      { 
        status: isMissingCredentials ? 500 : isNotFound ? 404 : 502, // 502 = Bad Gateway (upstream API issue)
        headers: {
          // Don't cache configuration errors, but cache API errors briefly to prevent hammering
          'Cache-Control': isMissingCredentials 
            ? 'no-cache, no-store, must-revalidate' 
            : 'public, s-maxage=60, stale-while-revalidate=120' // Cache errors for 1 min
        }
      }
    );
  }
}