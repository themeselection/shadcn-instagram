"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Layers,
  Heart,
  MessageCircle,
  X,
  AlertCircle,
  Camera,
  CheckCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function proxyImg(url: string): string {
  if (!url) return url;
  if (url.startsWith("/api/proxy-image") || url.startsWith("/")) return url;
  return "/api/proxy-image?url=" + encodeURIComponent(url);
}

interface InstagramPost {
  id: string;
  image: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  url: string;
  timestamp: string;
  type: "image" | "video" | "carousel";
  carouselMedia?: Array<{
    url: string;
    type: "IMAGE" | "VIDEO";
    thumbnail?: string;
  }>;
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

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

const PostTypeIcon = ({ type }: { type: InstagramPost["type"] }) => {
  if (type === "video") {
    return <Play className="w-4 h-4" fill="white" />;
  }
  if (type === "carousel") {
    return <Layers className="w-4 h-4" fill="white" />;
  }
  return null;
};

interface PostModalProps {
  post: InstagramPost;
  profile: InstagramProfile;
  open: boolean;
  onClose: () => void;
}

function PostModal({ post, profile, open, onClose }: PostModalProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Reset carousel index when post changes
  useEffect(() => {
    setCurrentMediaIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  // Determine media to display
  const mediaItems =
    post.type === "carousel" && post.carouselMedia
      ? post.carouselMedia
      : [
          {
            url: post.image,
            type:
              post.type === "video" ? "VIDEO" : ("IMAGE" as "IMAGE" | "VIDEO"),
            thumbnail: post.thumbnail,
          },
        ];

  const currentMedia = mediaItems[currentMediaIndex];
  const hasMultipleMedia = mediaItems.length > 1;

  const goToPrevious = () => {
    setCurrentMediaIndex((prev) =>
      prev > 0 ? prev - 1 : mediaItems.length - 1,
    );
  };

  const goToNext = () => {
    setCurrentMediaIndex((prev) =>
      prev < mediaItems.length - 1 ? prev + 1 : 0,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl! p-0 gap-0 overflow-hidden max-h-150! h-full"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Post by {profile.username}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Instagram post with {formatCount(post.likes)} likes and{" "}
          {formatCount(post.comments)} comments
        </DialogDescription>
        <div className="bg-white rounded-2xl overflow-hidden w-full max-h-[90vh] flex flex-col md:flex-row">
          {/* Media - Image or Video */}
          <div className="relative md:w-[55%] bg-black shrink-0 aspect-square md:aspect-auto">
            {currentMedia.type === "VIDEO" ? (
              <video
                src={proxyImg(currentMedia.url)}
                className="size-full object-contain"
                controls
                autoPlay
                loop
                playsInline
              >
                <track kind="captions" />
                Your browser does not support the video tag.
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxyImg(currentMedia.url)}
                alt={post.caption}
                className="size-full object-fit"
              />
            )}

            {/* Media type indicator */}
            {!hasMultipleMedia &&
              (post.type === "video" || post.type === "carousel") && (
                <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5">
                  <PostTypeIcon type={post.type} />
                </div>
              )}

            {/* Carousel navigation */}
            {hasMultipleMedia && (
              <>
                {/* Previous button */}
                <Button
                  onClick={goToPrevious}
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full h-8 w-8 z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </Button>

                {/* Next button */}
                <Button
                  onClick={goToNext}
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full h-8 w-8 z-10"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </Button>

                {/* Carousel indicator dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {mediaItems.map((_, index) => (
                    <button
                      key={`${post.id}-media-${index}`}
                      type="button"
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentMediaIndex
                          ? "bg-white w-2 h-2"
                          : "bg-white/50"
                      }`}
                      aria-label={`Go to media ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="absolute top-3 right-3 bg-black/50 rounded-full px-3 py-1 text-white text-sm font-medium">
                  {currentMediaIndex + 1} / {mediaItems.length}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Avatar className="w-9 h-9 ring-2 ring-pink-400 ring-offset-1">
                <AvatarImage
                  src={proxyImg(profile.profile_pic)}
                  alt={profile.username}
                />
                <AvatarFallback>
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm  truncate">
                  {profile.username}
                </p>
              </div>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline shrink-0"
              >
                View on Instagram ↗
              </a>
            </div>

            {/* Caption */}
            <div className="flex-1 overflow-y-auto p-4">
              {post.caption && (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {post.caption}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="p-4 border-t space-y-1">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon">
                  <Heart className="w-6 h-6" />
                </Button>
                <Button variant="outline" size="icon">
                  <MessageCircle className="w-6 h-6" />
                </Button>
              </div>
              <p className="font-semibold text-sm">
                {formatCount(post.likes)} likes
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCount(post.comments)} comments
              </p>
            </div>
          </div>

          {/* Close button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full z-10"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InstagramProfilePage() {
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const POSTS_PER_PAGE = 4; // 2x2 grid
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const currentPosts = posts.slice(
    currentPage * POSTS_PER_PAGE,
    (currentPage + 1) * POSTS_PER_PAGE,
  );

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from your configured Instagram Business Account
        const res = await fetch("/api/instagram/posts");
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch data");
        }

        setProfile(data.profile);
        setPosts(data.posts); // Show all posts for carousel
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Failed to load</p>
                  <p className="text-sm mt-0.5 opacity-80">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-0 animate-pulse">
              {/* Profile skeleton */}
              <div className="flex flex-col items-center px-6 pt-8 pb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
                <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                <div className="flex gap-8 justify-center mb-5 py-2">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-12" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                </div>
                <div className="h-9 bg-gray-200 rounded-lg w-32" />
              </div>
              {/* Grid skeleton */}
              <div className="grid grid-cols-2 gap-0">
                <div className="aspect-square bg-gray-200 border border-gray-100" />
                <div className="aspect-square bg-gray-300 border border-gray-100" />
                <div className="aspect-square bg-gray-300 border border-gray-100" />
                <div className="aspect-square bg-gray-200 border border-gray-100" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Header */}
        {profile && !loading && (
          <Card className="overflow-hidden shadow-none p-0 boder-0">
            <CardContent className="p-0">
              {/* Profile Info Section */}
              <div className="flex flex-col items-center px-6 pt-8 pb-6 bg-white">
                {/* Profile Picture with gradient ring */}
                <div className="relative mb-2">
                  <div className="w-24 h-24 rounded-full p-0.5 bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                      <Avatar className="w-full h-full">
                        <AvatarImage
                          src={proxyImg(profile.profile_pic)}
                          alt={profile.username}
                        />
                        <AvatarFallback className="text-2xl">
                          {profile.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>

                {/* Profile Name & Username */}
                <div className="text-center mb-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-gray-900">
                      {profile.full_name || profile.username}
                    </h1>
                    <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />
                  </div>
                  <p className="text-sm text-gray-600">@{profile.username}</p>
                </div>

                {/* Stats Row */}
                <div className="flex gap-8 justify-center items-center mb-3 py-2">
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-base">
                      {formatCount(profile.posts_count)}
                    </div>
                    <div className="text-xs text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-base">
                      {formatCount(profile.followers)}
                    </div>
                    <div className="text-xs text-gray-600">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900 text-base">
                      {formatCount(profile.following)}
                    </div>
                    <div className="text-xs text-gray-600">Following</div>
                  </div>
                </div>

                {/* Follow Button */}
                <Button
                  asChild
                  className="bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg h-9 px-8 text-sm font-semibold shadow-sm"
                >
                  <a
                    href={`https://www.instagram.com/${profile.username}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Follow
                  </a>
                </Button>
              </div>

              {/* Posts Carousel Section */}
              {posts.length > 0 && (
                <div className="relative bg-white">
                  {/* Posts Grid - 2x2 */}
                  <div className="grid grid-cols-2 gap-0">
                    {currentPosts.map((post) => (
                      <Button
                        key={post.id}
                        variant="ghost"
                        onClick={() => setSelectedPost(post)}
                        className="relative aspect-square group overflow-hidden rounded-none p-0 h-auto hover:bg-transparent cursor-pointer border border-gray-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proxyImg(post.thumbnail || post.image)}
                          alt={post.caption}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay for video/carousel indicators */}
                        {(post.type === "video" ||
                          post.type === "carousel") && (
                          <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                            <PostTypeIcon type={post.type} />
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  {totalPages > 1 && (
                    <>
                      {/* Left Arrow */}
                      <Button
                        onClick={handlePrevious}
                        variant="ghost"
                        size="icon"
                        className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full h-10 w-10 z-10"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                      </Button>

                      {/* Right Arrow */}
                      <Button
                        onClick={handleNext}
                        variant="ghost"
                        size="icon"
                        className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full h-10 w-10 z-10"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* No Posts */}
              {posts.length === 0 && !profile.is_private && (
                <div className="p-12 text-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No posts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && profile && (
        <PostModal
          post={selectedPost}
          profile={profile}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
