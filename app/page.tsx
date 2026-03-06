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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          {/* Image */}
          <div className="relative md:w-[55%] bg-black shrink-0 aspect-square md:aspect-auto">
            <img
              src={proxyImg(post.image)}
              alt={post.caption}
              className="size-full object-fit"
            />
            {(post.type === "video" || post.type === "carousel") && (
              <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5">
                <PostTypeIcon type={post.type} />
              </div>
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
        setPosts(data.posts.slice(0, 9)); // Show latest 9 posts
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" px-4 py-8">
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
          <div className="animate-pulse space-y-6">
            {/* Profile skeleton */}
            <Card className="max-w-xl">
              <CardContent className="pt-6 flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-gray-200" />
                <div className="space-y-2 text-center w-full max-w-md">
                  <div className="h-6 bg-gray-200 rounded w-40 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-60 mx-auto" />
                  <div className="flex gap-8 justify-center mt-4">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Grid skeleton */}
            <div className="flex flex-wrap">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        )}

        {/* Profile Header */}
        {profile && !loading && (
          <>
            <Card className="mb-6 max-w-xl mx-auto ">
              <CardContent className="pt-8 text-center">
                <div className="flex flex-col items-center">
                  {/* Profile Picture with gradient ring */}
                  <div className="relative mb-4">
                    <div className="w-28 h-28 rounded-full p-0.5 bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                        <Avatar className="w-full h-full">
                          <AvatarImage
                            src={proxyImg(profile.profile_pic)}
                            alt={profile.username}
                          />
                          <AvatarFallback>
                            {profile.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>

                  {/* Username & Stats */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold ">
                        {profile.username}
                      </h1>
                      {/* Verified badge */}
                      <CheckCircle className="w-5 h-5 text-primary fill-current" />
                    </div>
                    <p className="text-muted-foreground mb-3">
                      {profile.full_name}
                    </p>
                    {profile.bio && (
                      <p className="text-sm text-foreground leading-relaxed max-w-md mx-auto mb-4">
                        {profile.bio}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex gap-8 justify-center items-center mt-4">
                      <div className="text-center">
                        <div className="font-bold  text-xl">
                          {formatCount(profile.posts_count)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Posts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold  text-xl">
                          {formatCount(profile.followers)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Followers
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold  text-xl">
                          {formatCount(profile.following)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Following
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <Button
                    asChild
                    className="bg-linear-to-r from-pink-500 to-purple-600 hover:opacity-90 rounded-full"
                  >
                    <a
                      href={`https://www.instagram.com/${profile.username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Camera className="w-4 h-4" />
                      Follow
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts Grid */}
            {posts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 flex-wrap w-full gap-0 xl:grid-cols-6">
                {posts.map((post) => (
                  <Button
                    key={post.id}
                    variant="ghost"
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square group overflow-hidden rounded-sm sm:rounded p-0 h-auto hover:bg-transparent cursor-pointer"
                  >
                    <img
                      src={proxyImg(post.thumbnail || post.image)}
                      alt={post.caption}
                      className=" object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Type badge */}
                    {(post.type === "video" || post.type === "carousel") && (
                      <Badge className="absolute top-2 right-2 bg-black/50 rounded-full p-1 border-0">
                        <PostTypeIcon type={post.type} />
                      </Badge>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5 text-white">
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="text-sm font-semibold">
                          {formatCount(post.likes)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white">
                        <MessageCircle className="w-5 h-5 fill-current" />
                        <span className="text-sm font-semibold">
                          {formatCount(post.comments)}
                        </span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* No Posts */}
            {posts.length === 0 && !profile.is_private && (
              <Card>
                <CardContent className="pt-20 pb-20 text-center text-muted-foreground">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No posts yet</p>
                </CardContent>
              </Card>
            )}
          </>
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
