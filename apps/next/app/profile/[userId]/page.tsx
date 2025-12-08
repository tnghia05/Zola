"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getUserPostsApi,
  getUserById,
  getFriends,
  getUsersByIds,
  blockUserApi,
  unblockUserApi,
  getBlockStatusApi,
  unfriendUserApi,
  getCurrentUserId,
  getUserPhotosApi,
  updateProfileApi,
  uploadMediaApi,
  getUserReelsApi,
  Reel,
  sendFriendRequestApi,
} from "@zola/app/api";
import { useComments } from "@zola/app/hooks/useSocial";
import { AppLayout } from "@zola/app/components/AppLayout";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { AvatarCropModal } from "@zola/app/components/AvatarCropModal";
import { PostCard } from "@zola/app/components/PostCard.web";
import { ReactionType, reactToPostApi, removeReactionApi } from "@zola/app/api";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";

const Profile = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("user_id"));
    }
  }, []);

  const isSelf = userId === currentUserId || !userId;
  const targetUserId = userId || currentUserId || "";

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [postReactions, setPostReactions] = useState<Record<string, ReactionType | null>>({});
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedYou, setHasBlockedYou] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "photos" | "about" | "friends" | "reels">("posts");
  const [activePhotoTab, setActivePhotoTab] = useState<"authored" | "tagged">("authored");
  const [aboutCategory, setAboutCategory] = useState<"overview" | "work" | "places" | "contact" | "relationship" | "details">("overview");
  const [activeFriendsTab, setActiveFriendsTab] = useState<"all" | "recent" | "birthdays" | "college" | "city" | "hometown" | "following">("all");
  const [friendsSearchQuery, setFriendsSearchQuery] = useState("");
  const [photosAuthored, setPhotosAuthored] = useState<Array<{ postId: string; url: string }>>([]);
  const [photosTagged, setPhotosTagged] = useState<Array<{ postId: string; url: string }>>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reelsNextCursor, setReelsNextCursor] = useState<string | null>(null);
  const [reelsHasNext, setReelsHasNext] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    works: "",
    colleges: "",
    highSchools: "",
    currentCity: "",
    hometown: "",
    relationshipStatus: "",
    phone: "",
    instagram: "",
    facebook: "",
    website: "",
  });
  // Inline edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState({
    work: "",
    workPosition: "",
    workCity: "",
    workDescription: "",
    workCurrent: true,
    college: "",
    collegeYear: "",
    highSchool: "",
    highSchoolYear: "",
    currentCity: "",
    hometown: "",
    relationshipStatus: "",
    phone: "",
    bio: "",
    instagram: "",
    facebook: "",
    website: "",
  });
  const listRef = useRef<HTMLDivElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (!targetUserId) return;
    loadUser();
    loadPosts();
    loadFriends();
    if (!isSelf) {
      loadBlockStatus();
    }
    if (activeTab === "photos") {
      loadPhotos();
    }
    if (activeTab === "friends" && friends.length === 0) {
      loadFriends();
    }
  }, [targetUserId, isSelf, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById(`profile-menu-${targetUserId}`);
      if (menu && !menu.contains(event.target as Node)) {
        menu.style.display = "none";
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [targetUserId]);

  const loadBlockStatus = async () => {
    try {
      const status = await getBlockStatusApi(targetUserId);
      setIsBlocked(status.isBlocked);
      setHasBlockedYou(status.hasBlockedYou);
    } catch (error) {
      console.error("Failed to load block status:", error);
    }
  };

  const handleBlock = async () => {
    try {
      await blockUserApi(targetUserId);
      setIsBlocked(true);
      alert("Đã chặn người dùng này");
    } catch (error: any) {
      console.error("Failed to block user:", error);
      alert(error.response?.data?.error || "Không thể chặn người dùng");
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockUserApi(targetUserId);
      setIsBlocked(false);
      alert("Đã bỏ chặn người dùng này");
    } catch (error: any) {
      console.error("Failed to unblock user:", error);
      alert(error.response?.data?.error || "Không thể bỏ chặn người dùng");
    }
  };

  const handleUnfriend = async () => {
    if (!confirm("Bạn có chắc muốn hủy kết bạn với người này?")) return;
    try {
      await unfriendUserApi(targetUserId);
      setIsFriend(false);
      alert("Đã hủy kết bạn");
    } catch (error: any) {
      console.error("Failed to unfriend user:", error);
      alert(error.response?.data?.error || "Không thể hủy kết bạn");
    }
  };

  const handleSendFriendRequest = async () => {
    if (isSendingRequest || friendRequestSent || isFriend) return;
    
    try {
      setIsSendingRequest(true);
      await sendFriendRequestApi(targetUserId);
      setFriendRequestSent(true);
      alert("Đã gửi lời mời kết bạn!");
    } catch (error: any) {
      console.error("Failed to send friend request:", error);
      alert(error.response?.data?.error || error.message || "Không thể gửi lời mời kết bạn");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const [authoredRes, taggedRes] = await Promise.allSettled([
        getUserPhotosApi(targetUserId, "authored"),
        getUserPhotosApi(targetUserId, "tagged"),
      ]);
      const mapPhotos = (items: any[]) =>
        items.flatMap((p) =>
          (p.media || []).map((m: any) => ({ postId: p.postId, url: m.url }))
        );

      const authoredItems =
        authoredRes.status === "fulfilled" && authoredRes.value?.items
          ? authoredRes.value.items
          : [];
      const taggedItems =
        taggedRes.status === "fulfilled" && taggedRes.value?.items
          ? taggedRes.value.items
          : [];

      let authored = mapPhotos(authoredItems);
      let tagged = mapPhotos(taggedItems);

      // Fallback: nếu API trả trống, lấy từ danh sách posts đã tải
      if (authored.length === 0 && posts.length > 0) {
        authored = posts.flatMap((p: any) =>
          (p.media || [])
            .filter((m: any) => m && m.url)
            .map((m: any) => ({ postId: p._id, url: m.url }))
        );
      }
      if (tagged.length === 0 && posts.length > 0) {
        tagged = posts
          .filter((p: any) => Array.isArray(p.taggedUsers) && p.taggedUsers.some((u: any) => String(u?._id || u) === targetUserId))
          .flatMap((p: any) =>
            (p.media || [])
              .filter((m: any) => m && m.url)
              .map((m: any) => ({ postId: p._id, url: m.url }))
          );
      }

      setPhotosAuthored(authored);
      setPhotosTagged(tagged);
    } catch (error) {
      console.error("Failed to load photos:", error);
      setPhotosAuthored([]);
      setPhotosTagged([]);
    }
  };

  const loadUser = async () => {
    try {
      const data = await getUserById(targetUserId);
      console.log("loadUser - API response:", data);
      console.log("loadUser - coverImage:", data.coverImage);
      setUser(data);
      setProfileForm({
        bio: data.bio || "",
        works: (data.works || []).join("\n"),
        colleges: (data.colleges || []).join("\n"),
        highSchools: (data.highSchools || []).join("\n"),
        currentCity: data.currentCity || "",
        hometown: data.hometown || "",
        relationshipStatus: data.relationshipStatus || "",
        phone: data.phone || "",
        instagram: data.instagram || "",
        facebook: data.facebook || "",
        website: data.website || "",
      });
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const loadPosts = async (cursor?: string) => {
    try {
      setIsLoading(true);
      const data = await getUserPostsApi(targetUserId, cursor);
      if (cursor) {
        setPosts((prev) => [...prev, ...data.items]);
      } else {
        setPosts(data.items);
      }
      setHasNext(data.hasNext);
      setNextCursor(data.nextCursor ?? null);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReaction = async (postId: string, reaction: ReactionType) => {
    try {
      await reactToPostApi(postId, reaction);
      setPostReactions((prev) => ({ ...prev, [postId]: reaction }));
      // Update post reaction count
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            const oldReaction = postReactions[postId];
            const newReaction = reaction;
            const reactionCounts = { ...(p.reactionCounts || {}) };
            
            // Decrease old reaction count
            if (oldReaction) {
              reactionCounts[oldReaction] = Math.max(0, (reactionCounts[oldReaction] || 0) - 1);
            }
            
            // Increase new reaction count
            reactionCounts[newReaction] = (reactionCounts[newReaction] || 0) + 1;
            
            return {
              ...p,
              reactionCounts,
              likeCount: Object.values(reactionCounts).reduce((sum, count) => sum + count, 0),
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error("Failed to react to post:", error);
    }
  };

  const handleClearReaction = async (postId: string) => {
    try {
      await removeReactionApi(postId);
      const oldReaction = postReactions[postId];
      setPostReactions((prev) => {
        const newReactions = { ...prev };
        delete newReactions[postId];
        return newReactions;
      });
      // Update post reaction count
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId && oldReaction) {
            const reactionCounts = { ...(p.reactionCounts || {}) };
            reactionCounts[oldReaction] = Math.max(0, (reactionCounts[oldReaction] || 0) - 1);
            return {
              ...p,
              reactionCounts,
              likeCount: Object.values(reactionCounts).reduce((sum, count) => sum + count, 0),
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "photos" && posts.length > 0 && photosAuthored.length === 0 && photosTagged.length === 0) {
      loadPhotos();
    }
    if (activeTab === "reels" && reels.length === 0 && !reelsLoading) {
      loadReels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, activeTab]);

  const loadReels = async (cursor?: string) => {
    if (reelsLoading) return;
    setReelsLoading(true);
    try {
      const data = await getUserReelsApi(targetUserId, cursor);
      if (cursor) {
        setReels((prev) => [...prev, ...data.items]);
      } else {
        setReels(data.items);
      }
      setReelsNextCursor(data.nextCursor);
      setReelsHasNext(data.hasNext);
    } catch (error) {
      console.error("Failed to load reels:", error);
      setReels([]);
    } finally {
      setReelsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      if (!isSelf) {
        // Check if target user is a friend
        const data = await getFriends();
        if (Array.isArray(data.friendIds) && data.friendIds.includes(targetUserId)) {
          setIsFriend(true);
        }
        return;
      }
  
      const data = await getFriends();
      console.log("getFriends raw data:", data);
  
      if (Array.isArray(data.friendIds) && data.friendIds.length > 0) {
        const users = await getUsersByIds(data.friendIds);
        console.log("friends users:", users);
        setFriends(users.users || []);
      } else {
        console.log("No friendIds returned from API");
        setFriends([]);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  const saveInlineField = async (fieldType: string) => {
    try {
      let updateData: any = {};
      
      switch (fieldType) {
        case "work":
          if (inlineForm.work.trim()) {
            const workEntry = inlineForm.work + (inlineForm.workPosition ? ` - ${inlineForm.workPosition}` : "");
            updateData.works = [...(user.works || []), workEntry];
          }
          break;
        case "college":
          if (inlineForm.college.trim()) {
            updateData.colleges = [...(user.colleges || []), inlineForm.college];
          }
          break;
        case "highSchool":
          if (inlineForm.highSchool.trim()) {
            updateData.highSchools = [...(user.highSchools || []), inlineForm.highSchool];
          }
          break;
        case "currentCity":
          updateData.currentCity = inlineForm.currentCity;
          break;
        case "hometown":
          updateData.hometown = inlineForm.hometown;
          break;
        case "relationship":
          updateData.relationshipStatus = inlineForm.relationshipStatus;
          break;
        case "phone":
          updateData.phone = inlineForm.phone;
          break;
        case "bio":
          updateData.bio = inlineForm.bio;
          break;
        case "instagram":
          updateData.instagram = inlineForm.instagram;
          break;
        case "facebook":
          updateData.facebook = inlineForm.facebook;
          break;
        case "website":
          updateData.website = inlineForm.website;
          break;
      }
      
      await updateProfileApi(updateData);
      await loadUser();
      setEditingField(null);
      setInlineForm({
        work: "",
        workPosition: "",
        workCity: "",
        workDescription: "",
        workCurrent: true,
        college: "",
        collegeYear: "",
        highSchool: "",
        highSchoolYear: "",
        currentCity: "",
        hometown: "",
        relationshipStatus: "",
        phone: "",
        bio: "",
        instagram: "",
        facebook: "",
        website: "",
      });
    } catch (error) {
      console.error("Failed to save field:", error);
      alert("Lưu thất bại");
    }
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setInlineForm({
      work: "",
      workPosition: "",
      workCity: "",
      workDescription: "",
      workCurrent: true,
      college: "",
      collegeYear: "",
      highSchool: "",
      highSchoolYear: "",
      currentCity: "",
      hometown: "",
      relationshipStatus: "",
      phone: "",
      bio: "",
      instagram: "",
      facebook: "",
      website: "",
    });
  };

  const userPhotos = useMemo(() => {
    const photos: { url: string; postId: string }[] = [];
    posts.forEach((post) => {
      if (post.media && Array.isArray(post.media)) {
        post.media.forEach((media: any) => {
          if (media.type === "image" || media.url) {
            photos.push({ url: media.url, postId: post._id });
          }
        });
      }
    });
    return photos.slice(0, 9);
  }, [posts]);

  const displayFriends = useMemo(() => {
    return friends.slice(0, 9);
  }, [friends]);

  useEffect(() => {
    const onScroll = () => {
      if (!hasNext || isLoading) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      if (scrollPosition >= threshold) {
        if (nextCursor) loadPosts(nextCursor);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNext, isLoading, nextCursor]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleCoverUpload called", e.target.files);
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("Uploading cover image:", file.name);
    setIsUploadingCover(true);
    try {
      const result = await uploadMediaApi(file);
      console.log("Upload result:", result);
      if (result.url) {
        console.log("Updating profile with coverImage URL:", result.url);
        try {
          const updatedUser = await updateProfileApi({ coverImage: result.url });
          console.log("Update profile response:", updatedUser);
          console.log("Updated user coverImage:", updatedUser?.coverImage);
          console.log("Updated user keys:", updatedUser ? Object.keys(updatedUser) : "null");
          
          // Update state immediately with the response
          if (updatedUser) {
            // Use the coverImage from response, or fallback to result.url
            const coverImageUrl = updatedUser.coverImage || result.url;
            console.log("Using coverImage URL:", coverImageUrl);
            
            setUser((prev: any) => {
              if (!prev) {
                console.warn("Previous user state is null, using updatedUser directly");
                return { ...updatedUser, coverImage: coverImageUrl };
              }
              const newUser = { ...prev, coverImage: coverImageUrl };
              console.log("State updated - prev coverImage:", prev.coverImage);
              console.log("State updated - new coverImage:", newUser.coverImage);
              return newUser;
            });
          } else {
            console.warn("updatedUser is null/undefined, updating state directly with URL");
            setUser((prev: any) => {
              if (!prev) return null;
              return { ...prev, coverImage: result.url };
            });
          }
          
          // Wait a bit before reloading to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Also reload user to ensure consistency
          console.log("Reloading user...");
          await loadUser();
          console.log("Cover image updated successfully");
        } catch (updateError) {
          console.error("Error updating profile:", updateError);
          // Even if update fails, try to update state with the uploaded URL
          setUser((prev: any) => {
            if (!prev) return null;
            return { ...prev, coverImage: result.url };
          });
          throw updateError;
        }
      }
    } catch (error) {
      console.error("Failed to upload cover:", error);
      alert("Không thể tải ảnh bìa. Vui lòng thử lại.");
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh");
      return;
    }
    
    // Show crop modal
    setAvatarCropFile(file);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleAvatarCropSave = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true);
    try {
      // Convert blob to File
      const croppedFile = new File([croppedBlob], "avatar.png", { type: "image/png" });
      
      console.log("Uploading cropped avatar image");
      const result = await uploadMediaApi(croppedFile);
      console.log("Upload result:", result);
      
      if (result.url) {
        console.log("Updating profile with avatar URL:", result.url);
        try {
          const updatedUser = await updateProfileApi({ avatar: result.url });
          console.log("Update profile response:", updatedUser);
          console.log("Updated user avatar:", updatedUser?.avatar);
          
          // Update state immediately with the response
          if (updatedUser) {
            const avatarUrl = updatedUser.avatar || result.url;
            console.log("Using avatar URL:", avatarUrl);
            
            setUser((prev: any) => {
              if (!prev) {
                console.warn("Previous user state is null, using updatedUser directly");
                return { ...updatedUser, avatar: avatarUrl };
              }
              const newUser = { ...prev, avatar: avatarUrl };
              console.log("State updated - prev avatar:", prev.avatar);
              console.log("State updated - new avatar:", newUser.avatar);
              return newUser;
            });
          } else {
            console.warn("updatedUser is null/undefined, updating state directly with URL");
            setUser((prev: any) => {
              if (!prev) return null;
              return { ...prev, avatar: result.url };
            });
          }
          
          // Wait a bit before reloading to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Also reload user to ensure consistency
          console.log("Reloading user...");
          await loadUser();
          console.log("Avatar updated successfully");
        } catch (updateError) {
          console.error("Error updating profile:", updateError);
          // Even if update fails, try to update state with the uploaded URL
          setUser((prev: any) => {
            if (!prev) return null;
            return { ...prev, avatar: result.url };
          });
          throw updateError;
        }
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Không thể tải ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
      setAvatarCropFile(null);
    }
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  if (!user) {
    return (
      <div className="feed-root">
        <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
      </div>
    );
  }

  const header = (
    <FacebookNavbarWeb
      currentUser={user ? { _id: user._id, name: user.name, avatar: user.avatar } : null}
      onLogout={() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          window.location.href = "/login";
        }
      }}
    />
  );

  return (
    <>
    <AppLayout header={header} hideSidebars={true}>
      <div className="profile-container">
        {/* Cover Photo */}
        <div className="profile-cover-wrapper" style={{ position: "relative", width: "100%", zIndex: 1, marginBottom: 0 }}>
          {(() => {
            const coverImage = user?.coverImage;
            console.log("Rendering cover - user.coverImage:", coverImage);
            console.log("Rendering cover - coverImage type:", typeof coverImage);
            console.log("Rendering cover - coverImage truthy:", !!coverImage);
            console.log("Rendering cover - user object:", user);
            
            // Check if coverImage exists and is not empty string
            if (coverImage && coverImage.trim() !== "") {
              return (
                <img 
                  src={coverImage} 
                  alt="Cover" 
                  className="profile-cover" 
                  style={{ width: "100%", height: "350px", display: "block", objectFit: "cover" }}
                  onLoad={() => console.log("Cover image loaded successfully:", coverImage)}
                  onError={(e) => {
                    console.error("Cover image failed to load:", coverImage);
                    console.error("Error details:", e);
                  }}
                />
              );
            } else {
              return (
                <div className="profile-cover-gradient" style={{ width: "100%", height: "350px", position: "relative" }} />
              );
            }
          })()}
          {isSelf && (
            <div 
              className="profile-cover-edit-btn-wrapper"
              style={{ 
                position: "absolute", 
                bottom: 16, 
                right: 16, 
                zIndex: 10000, 
                pointerEvents: "auto",
                isolation: "isolate",
              }}
            >
              <input
                id="cover-image-input"
                type="file"
                accept="image/*"
                ref={coverInputRef}
                style={{ display: "none" }}
                onChange={handleCoverUpload}
                disabled={isUploadingCover}
              />
              <label
                htmlFor="cover-image-input"
                onClick={(e) => {
                  console.log("Label clicked, isSelf:", isSelf, "isUploadingCover:", isUploadingCover);
                  if (isUploadingCover) {
                    e.preventDefault();
                    return;
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  background: isUploadingCover ? "rgba(200,200,200,0.9)" : "rgba(255,255,255,0.9)",
                  border: "none",
                  borderRadius: 8,
                  color: "#050505",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isUploadingCover ? "wait" : "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  pointerEvents: isUploadingCover ? "none" : "auto",
                  transition: "background 0.2s",
                  userSelect: "none",
                  position: "relative",
                  zIndex: 10001,
                }}
                onMouseEnter={(e) => {
                  if (!isUploadingCover) {
                    e.currentTarget.style.background = "rgba(255,255,255,1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUploadingCover) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.9)";
                  }
                }}
              >
                <span>📷</span>
                <span>{isUploadingCover ? "Đang tải..." : "Chỉnh sửa ảnh bìa"}</span>
              </label>
            </div>
          )}
        </div>

        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            {/* Avatar with edit button */}
            <div className="profile-avatar" style={{ position: "relative" }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span className="profile-avatar-initials">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
              {isSelf && (
                <>
                  <input
                    id="avatar-image-input"
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    style={{ display: "none" }}
                    onChange={handleAvatarFileSelect}
                    disabled={isUploadingAvatar}
                  />
                  <label
                    htmlFor="avatar-image-input"
                    onClick={(e) => {
                      console.log("Avatar label clicked, isSelf:", isSelf, "isUploadingAvatar:", isUploadingAvatar);
                      if (isUploadingAvatar) {
                        e.preventDefault();
                        return;
                      }
                    }}
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: isUploadingAvatar ? "rgba(200,200,200,0.9)" : "#3a3b3c",
                      border: "2px solid #242526",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isUploadingAvatar ? "wait" : "pointer",
                      fontSize: 18,
                      zIndex: 1000,
                      pointerEvents: isUploadingAvatar ? "none" : "auto",
                      transition: "background 0.2s",
                      userSelect: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isUploadingAvatar) {
                        e.currentTarget.style.background = "#4a4b4c";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isUploadingAvatar) {
                        e.currentTarget.style.background = "#3a3b3c";
                      }
                    }}
                  >
                    {isUploadingAvatar ? "⏳" : "📷"}
                  </label>
                </>
              )}
            </div>

            <div className="profile-actions">
              {isSelf ? (
                <>
                  <button className="profile-action-btn profile-action-btn--primary">
                    <span>➕</span>
                    <span>Thêm vào tin</span>
                  </button>
                  <button className="profile-action-btn profile-action-btn--secondary">
                    <span>✏️</span>
                    <span>Chỉnh sửa trang cá nhân</span>
                  </button>
                </>
              ) : (
                <>
                  {hasBlockedYou ? (
                    <div style={{ padding: "8px 16px", background: "#3A3B3C", borderRadius: "8px", color: "#B0B3B8", fontSize: "14px" }}>
                      Người này đã chặn bạn
                    </div>
                  ) : (
                    <>
                      <button 
                        className="profile-action-btn profile-action-btn--primary"
                        onClick={handleSendFriendRequest}
                        disabled={isSendingRequest || friendRequestSent || isFriend}
                        style={{
                          opacity: (isSendingRequest || friendRequestSent || isFriend) ? 0.6 : 1,
                          cursor: (isSendingRequest || friendRequestSent || isFriend) ? "not-allowed" : "pointer",
                        }}
                      >
                        <span>👤</span>
                        <span>
                          {isSendingRequest 
                            ? "Đang gửi..." 
                            : friendRequestSent 
                            ? "Đã gửi lời mời" 
                            : isFriend 
                            ? "Bạn bè" 
                            : "Thêm bạn bè"}
                        </span>
                      </button>
                      <button className="profile-action-btn profile-action-btn--secondary">
                        <span>💬</span>
                        <span>Nhắn tin</span>
                      </button>
                      <div style={{ position: "relative" }}>
                        <button
                          className="profile-action-btn profile-action-btn--secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            const menu = document.getElementById(`profile-menu-${targetUserId}`);
                            if (menu) {
                              menu.style.display = menu.style.display === "block" ? "none" : "block";
                            }
                          }}
                        >
                          <span>⋯</span>
                        </button>
                        <div
                          id={`profile-menu-${targetUserId}`}
                          style={{
                            display: "none",
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "8px",
                            background: "#242526",
                            border: "1px solid #3A3B3C",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            zIndex: 1000,
                            minWidth: "200px",
                          }}
                        >
                          {isBlocked ? (
                            <button
                              onClick={handleUnblock}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "transparent",
                                border: "none",
                                color: "#E4E6EB",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3B3C")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              Bỏ chặn
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleBlock}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
                                  background: "transparent",
                                  border: "none",
                                  color: "#E4E6EB",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3B3C")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                Chặn
                              </button>
                              {isFriend && (
                                <button
                                  onClick={handleUnfriend}
                                  style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "transparent",
                                    border: "none",
                                    color: "#E4E6EB",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    borderTop: "1px solid #3A3B3C",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3B3C")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  Hủy kết bạn
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="profile-info">
            <h1 className="profile-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user.name || "Người dùng"}
              {user.isVerified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#1877f2",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                  title="Verified"
                >
                  ✓
                </span>
              )}
            </h1>
            {user.email && <p className="profile-email">{user.email}</p>}
          </div>

          <div className="profile-tabs-wrapper">
            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === "posts" ? "profile-tab--active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                Bài viết
              </button>
              <button
                className={`profile-tab ${activeTab === "about" ? "profile-tab--active" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                Giới thiệu
              </button>
              <button
                className={`profile-tab ${activeTab === "friends" ? "profile-tab--active" : ""}`}
                onClick={() => setActiveTab("friends")}
              >
                Bạn bè
              </button>
              <button
                className={`profile-tab ${activeTab === "photos" ? "profile-tab--active" : ""}`}
                onClick={() => setActiveTab("photos")}
              >
                Ảnh / Albums
              </button>
              <button
                className={`profile-tab ${activeTab === "reels" ? "profile-tab--active" : ""}`}
                onClick={() => setActiveTab("reels")}
              >
                Reels
              </button>
            </div>
          </div>
        </div>

        <div className="profile-content" style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "16px" }}>
          <div className="profile-left-column" style={{ width: "360px", flexShrink: 0, position: "sticky", top: "80px", height: "fit-content" }}>
            <div className="profile-intro-card">
              <h3>Giới thiệu</h3>
              {user.bio && <div className="profile-intro-item">“{user.bio}”</div>}
              <div className="profile-intro-item">
                {user.currentCity ? `Sống tại ${user.currentCity}` : "Chưa cập nhật nơi ở"}
              </div>
              <div className="profile-intro-item">
                {user.hometown ? `Đến từ ${user.hometown}` : "Chưa cập nhật quê quán"}
              </div>
              <div className="profile-intro-item">
                {user.relationshipStatus ? user.relationshipStatus : "Chưa cập nhật tình trạng"}
              </div>
              {user.works && user.works.length > 0 && (
                <div className="profile-intro-item">
                  🏢 Làm việc tại:
                  <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
                    {user.works.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {user.colleges && user.colleges.length > 0 && (
                <div className="profile-intro-item">
                  🎓 Đại học / Cao đẳng:
                  <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
                    {user.colleges.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {user.highSchools && user.highSchools.length > 0 && (
                <div className="profile-intro-item">
                  🏫 Trung học:
                  <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
                    {user.highSchools.map((h: string, idx: number) => (
                      <li key={idx}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {user.phone && (
                <div className="profile-intro-item">
                  📞 {user.phone}
                </div>
              )}
              {user.instagram && (
                <div className="profile-intro-item">📸 Instagram: {user.instagram}</div>
              )}
              {user.facebook && (
                <div className="profile-intro-item">📘 Facebook: {user.facebook}</div>
              )}
              {user.website && (
                <div className="profile-intro-item">🔗 Website: {user.website}</div>
              )}
              {isSelf && (
                <button
                  style={{ width: "100%", padding: "8px", background: "#3A3B3C", color: "#E4E6EB", borderRadius: "6px", border: "none", fontWeight: 600, marginTop: "16px", cursor: "pointer" }}
                  onClick={() => setShowEditProfile(true)}
                >
                  Chỉnh sửa chi tiết
                </button>
              )}
            </div>

            <div className="profile-photos-card">
              <div className="profile-card-header">
                <h3>Ảnh</h3>
                {userPhotos.length > 0 && (
                  <button className="profile-card-link">Xem tất cả ảnh</button>
                )}
              </div>
              {userPhotos.length > 0 ? (
                <div className="profile-photos-grid">
                  {userPhotos.map((photo, index) => (
                    <div key={`${photo.postId}-${index}`} className="profile-photo-item">
                      <img src={photo.url} alt={`Photo ${index + 1}`} className="profile-photo-img" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-widget-empty">
                  {isSelf ? "Bạn chưa có ảnh nào" : "Chưa có ảnh"}
                </div>
              )}
            </div>

            <div className="profile-friends-card">
              <div className="profile-card-header">
                <div>
                  <h3>Bạn bè</h3>
                  <p className="profile-friends-count">{friends.length} người bạn</p>
                </div>
                {displayFriends.length > 0 && (
                  <button className="profile-card-link" onClick={() => navigate("/friends")}>
                    Xem tất cả bạn bè
                  </button>
                )}
              </div>
              {displayFriends.length > 0 ? (
                <div className="profile-friends-grid">
                  {displayFriends.map((friend) => (
                    <div
                      key={friend._id}
                      className="profile-friend-item"
                      onClick={() => navigate(`/profile/${friend._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="profile-friend-avatar">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="profile-friend-img" />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", fontWeight: 700, fontSize: "24px" }}>
                            {friend.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="profile-friend-name">{friend.name || friend.email || "User"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-widget-empty">
                  {isSelf ? "Bạn chưa có bạn bè nào" : "Chưa có bạn bè"}
                </div>
              )}
            </div>
          </div>

          <div className="profile-right-column" style={{ flex: 1, minWidth: 0 }} ref={listRef}>
            {activeTab === "about" && (
              <div className="profile-about-fb" style={{ display: "flex", gap: 0, background: "#242526", borderRadius: 8, overflow: "hidden" }}>
                {/* Sidebar categories */}
                <div className="profile-about-sidebar" style={{ width: 280, flexShrink: 0, borderRight: "1px solid #3a3b3c", padding: "16px 0" }}>
                  <h3 style={{ padding: "0 16px 12px", margin: 0, fontSize: 20, fontWeight: 700 }}>Giới thiệu</h3>
                  <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[
                      { key: "overview", label: "Tổng quan" },
                      { key: "work", label: "Công việc và học vấn" },
                      { key: "places", label: "Nơi từng sống" },
                      { key: "contact", label: "Thông tin liên hệ và cơ bản" },
                      { key: "relationship", label: "Gia đình và các mối quan hệ" },
                      { key: "details", label: "Chi tiết về bạn" },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setAboutCategory(cat.key as any)}
                        style={{
                          textAlign: "left",
                          padding: "10px 16px",
                          background: aboutCategory === cat.key ? "#3a3b3c" : "transparent",
                          borderLeft: aboutCategory === cat.key ? "3px solid #2374e1" : "3px solid transparent",
                          border: "none",
                          color: aboutCategory === cat.key ? "#2374e1" : "#e4e6eb",
                          fontSize: 15,
                          fontWeight: aboutCategory === cat.key ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { if (aboutCategory !== cat.key) e.currentTarget.style.background = "#3a3b3c"; }}
                        onMouseLeave={(e) => { if (aboutCategory !== cat.key) e.currentTarget.style.background = "transparent"; }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content area */}
                <div className="profile-about-content" style={{ flex: 1, padding: 16 }}>
                  {/* Overview */}
                  {aboutCategory === "overview" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {isSelf && !user.works?.length && (
                        <AboutItemAdd label="Thêm nơi làm việc" onClick={() => { setAboutCategory("work"); setEditingField("work"); }} />
                      )}
                      {user.works && user.works.length > 0 && user.works.map((w: string, idx: number) => (
                        <AboutItem key={idx} icon="💼" label={w} isSelf={isSelf} onEdit={() => { setAboutCategory("work"); setEditingField("work"); }} />
                      ))}
                      {user.colleges && user.colleges.length > 0 ? (
                        user.colleges.map((c: string, idx: number) => (
                          <AboutItem key={idx} icon="🎓" label={`Học tại ${c}`} subLabel="Đã bắt đầu" isSelf={isSelf} onEdit={() => { setAboutCategory("work"); setEditingField("college"); }} />
                        ))
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm trường học" onClick={() => { setAboutCategory("work"); setEditingField("college"); }} />
                      ) : null}
                      {user.currentCity ? (
                        <AboutItem icon="🏠" label={`Sống tại ${user.currentCity}`} isSelf={isSelf} onEdit={() => { setAboutCategory("places"); setInlineForm({ ...inlineForm, currentCity: user.currentCity }); setEditingField("currentCity"); }} />
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm thành phố hiện tại" onClick={() => { setAboutCategory("places"); setEditingField("currentCity"); }} />
                      ) : null}
                      {user.hometown ? (
                        <AboutItem icon="📍" label={`Đến từ ${user.hometown}`} isSelf={isSelf} onEdit={() => { setAboutCategory("places"); setInlineForm({ ...inlineForm, hometown: user.hometown }); setEditingField("hometown"); }} />
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm quê quán" onClick={() => { setAboutCategory("places"); setEditingField("hometown"); }} />
                      ) : null}
                      {user.relationshipStatus ? (
                        <AboutItem icon="❤️" label={user.relationshipStatus} isSelf={isSelf} onEdit={() => { setAboutCategory("relationship"); setInlineForm({ ...inlineForm, relationshipStatus: user.relationshipStatus }); setEditingField("relationship"); }} />
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm tình trạng mối quan hệ" onClick={() => { setAboutCategory("relationship"); setEditingField("relationship"); }} />
                      ) : null}
                      {user.phone && (
                        <AboutItem icon="📞" label={user.phone} subLabel="Di động" isSelf={isSelf} onEdit={() => { setAboutCategory("contact"); setInlineForm({ ...inlineForm, phone: user.phone }); setEditingField("phone"); }} />
                      )}
                    </div>
                  )}

                  {/* Work & Education */}
                  {aboutCategory === "work" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Công việc</h4>
                      {user.works && user.works.length > 0 && user.works.map((w: string, idx: number) => (
                        <AboutItem key={idx} icon="💼" label={w} isSelf={isSelf} onEdit={() => setEditingField("work")} />
                      ))}
                      {isSelf && editingField === "work" ? (
                        <InlineEditForm
                          title="Công việc"
                          fields={[
                            { key: "work", label: "Công ty", placeholder: "Tên công ty", value: inlineForm.work, onChange: (v) => setInlineForm({ ...inlineForm, work: v }) },
                            { key: "workPosition", label: "Chức vụ", placeholder: "Vị trí công việc", value: inlineForm.workPosition, onChange: (v) => setInlineForm({ ...inlineForm, workPosition: v }) },
                            { key: "workCity", label: "Thành phố/Thị xã", placeholder: "Nơi làm việc", value: inlineForm.workCity, onChange: (v) => setInlineForm({ ...inlineForm, workCity: v }) },
                            { key: "workDescription", label: "Mô tả", placeholder: "Mô tả công việc", value: inlineForm.workDescription, onChange: (v) => setInlineForm({ ...inlineForm, workDescription: v }), multiline: true },
                          ]}
                          onSave={() => saveInlineField("work")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm nơi làm việc" onClick={() => setEditingField("work")} />
                      ) : !user.works?.length && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}

                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>Đại học</h4>
                      {user.colleges && user.colleges.length > 0 && user.colleges.map((c: string, idx: number) => (
                        <AboutItem key={idx} icon="🎓" label={c} isSelf={isSelf} onEdit={() => setEditingField("college")} />
                      ))}
                      {isSelf && editingField === "college" ? (
                        <InlineEditForm
                          title="Đại học"
                          fields={[
                            { key: "college", label: "Trường", placeholder: "Tên trường đại học / cao đẳng", value: inlineForm.college, onChange: (v) => setInlineForm({ ...inlineForm, college: v }) },
                            { key: "collegeYear", label: "Năm bắt đầu", placeholder: "VD: 2020", value: inlineForm.collegeYear, onChange: (v) => setInlineForm({ ...inlineForm, collegeYear: v }) },
                          ]}
                          onSave={() => saveInlineField("college")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm trường cao đẳng/đại học" onClick={() => setEditingField("college")} />
                      ) : !user.colleges?.length && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}

                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>Trung học</h4>
                      {user.highSchools && user.highSchools.length > 0 && user.highSchools.map((h: string, idx: number) => (
                        <AboutItem key={idx} icon="🏫" label={h} isSelf={isSelf} onEdit={() => setEditingField("highSchool")} />
                      ))}
                      {isSelf && editingField === "highSchool" ? (
                        <InlineEditForm
                          title="Trung học"
                          fields={[
                            { key: "highSchool", label: "Trường", placeholder: "Tên trường THPT", value: inlineForm.highSchool, onChange: (v) => setInlineForm({ ...inlineForm, highSchool: v }) },
                            { key: "highSchoolYear", label: "Năm bắt đầu", placeholder: "VD: 2017", value: inlineForm.highSchoolYear, onChange: (v) => setInlineForm({ ...inlineForm, highSchoolYear: v }) },
                          ]}
                          onSave={() => saveInlineField("highSchool")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf ? (
                        <AboutItemAdd label="Thêm trường trung học" onClick={() => setEditingField("highSchool")} />
                      ) : !user.highSchools?.length && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
                    </div>
                  )}

                  {/* Places lived */}
                  {aboutCategory === "places" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Nơi từng sống</h4>
                      {user.currentCity && (
                        <AboutItem icon="🏠" label={user.currentCity} subLabel="Thành phố hiện tại" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, currentCity: user.currentCity }); setEditingField("currentCity"); }} />
                      )}
                      {isSelf && editingField === "currentCity" ? (
                        <InlineEditForm
                          title="Thành phố hiện tại"
                          fields={[
                            { key: "currentCity", label: "Thành phố", placeholder: "VD: Đà Nẵng", value: inlineForm.currentCity, onChange: (v) => setInlineForm({ ...inlineForm, currentCity: v }) },
                          ]}
                          onSave={() => saveInlineField("currentCity")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.currentCity ? (
                        <AboutItemAdd label="Thêm thành phố hiện tại" onClick={() => setEditingField("currentCity")} />
                      ) : !user.currentCity && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}

                      {user.hometown && (
                        <AboutItem icon="📍" label={user.hometown} subLabel="Quê quán" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, hometown: user.hometown }); setEditingField("hometown"); }} />
                      )}
                      {isSelf && editingField === "hometown" ? (
                        <InlineEditForm
                          title="Quê quán"
                          fields={[
                            { key: "hometown", label: "Quê quán", placeholder: "VD: Quảng Ninh, Vietnam", value: inlineForm.hometown, onChange: (v) => setInlineForm({ ...inlineForm, hometown: v }) },
                          ]}
                          onSave={() => saveInlineField("hometown")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.hometown ? (
                        <AboutItemAdd label="Thêm quê quán" onClick={() => setEditingField("hometown")} />
                      ) : null}
                    </div>
                  )}

                  {/* Contact & basic info */}
                  {aboutCategory === "contact" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Thông tin liên hệ</h4>
                      {user.phone && (
                        <AboutItem icon="📞" label={user.phone} subLabel="Di động" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, phone: user.phone }); setEditingField("phone"); }} />
                      )}
                      {isSelf && editingField === "phone" ? (
                        <InlineEditForm
                          title="Số điện thoại"
                          fields={[
                            { key: "phone", label: "Số điện thoại", placeholder: "VD: 0901234567", value: inlineForm.phone, onChange: (v) => setInlineForm({ ...inlineForm, phone: v }) },
                          ]}
                          onSave={() => saveInlineField("phone")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.phone ? (
                        <AboutItemAdd label="Thêm số điện thoại" onClick={() => setEditingField("phone")} />
                      ) : !user.phone && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
                      
                      {user.email && (
                        <AboutItem icon="📧" label={user.email} subLabel="Email" isSelf={false} />
                      )}

                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px" }}>Trang web và liên kết xã hội</h4>
                      {user.website && (
                        <AboutItem icon="🔗" label={user.website} subLabel="Website" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, website: user.website }); setEditingField("website"); }} />
                      )}
                      {isSelf && editingField === "website" ? (
                        <InlineEditForm
                          title="Website"
                          fields={[
                            { key: "website", label: "URL", placeholder: "https://yoursite.com", value: inlineForm.website, onChange: (v) => setInlineForm({ ...inlineForm, website: v }) },
                          ]}
                          onSave={() => saveInlineField("website")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.website ? (
                        <AboutItemAdd label="Thêm website" onClick={() => setEditingField("website")} />
                      ) : null}

                      {user.instagram && (
                        <AboutItem icon="📸" label={user.instagram} subLabel="Instagram" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, instagram: user.instagram }); setEditingField("instagram"); }} />
                      )}
                      {isSelf && editingField === "instagram" ? (
                        <InlineEditForm
                          title="Instagram"
                          fields={[
                            { key: "instagram", label: "Username", placeholder: "@username", value: inlineForm.instagram, onChange: (v) => setInlineForm({ ...inlineForm, instagram: v }) },
                          ]}
                          onSave={() => saveInlineField("instagram")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.instagram ? (
                        <AboutItemAdd label="Thêm Instagram" onClick={() => setEditingField("instagram")} />
                      ) : null}

                      {user.facebook && (
                        <AboutItem icon="📘" label={user.facebook} subLabel="Facebook" isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, facebook: user.facebook }); setEditingField("facebook"); }} />
                      )}
                      {isSelf && editingField === "facebook" ? (
                        <InlineEditForm
                          title="Facebook"
                          fields={[
                            { key: "facebook", label: "Link Facebook", placeholder: "https://facebook.com/...", value: inlineForm.facebook, onChange: (v) => setInlineForm({ ...inlineForm, facebook: v }) },
                          ]}
                          onSave={() => saveInlineField("facebook")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.facebook ? (
                        <AboutItemAdd label="Thêm Facebook" onClick={() => setEditingField("facebook")} />
                      ) : null}
                    </div>
                  )}

                  {/* Relationship */}
                  {aboutCategory === "relationship" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Mối quan hệ</h4>
                      {user.relationshipStatus && (
                        <AboutItem icon="❤️" label={user.relationshipStatus} isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, relationshipStatus: user.relationshipStatus }); setEditingField("relationship"); }} />
                      )}
                      {isSelf && editingField === "relationship" ? (
                        <InlineEditForm
                          title="Tình trạng mối quan hệ"
                          fields={[
                            { key: "relationshipStatus", label: "Tình trạng", placeholder: "Độc thân / Hẹn hò / Đã kết hôn...", value: inlineForm.relationshipStatus, onChange: (v) => setInlineForm({ ...inlineForm, relationshipStatus: v }) },
                          ]}
                          onSave={() => saveInlineField("relationship")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.relationshipStatus ? (
                        <AboutItemAdd label="Thêm tình trạng mối quan hệ" onClick={() => setEditingField("relationship")} />
                      ) : !user.relationshipStatus && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
                    </div>
                  )}

                  {/* Details about you */}
                  {aboutCategory === "details" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Giới thiệu bản thân</h4>
                      {user.bio && (
                        <AboutItem icon="📝" label={user.bio} isSelf={isSelf} onEdit={() => { setInlineForm({ ...inlineForm, bio: user.bio }); setEditingField("bio"); }} />
                      )}
                      {isSelf && editingField === "bio" ? (
                        <InlineEditForm
                          title="Tiểu sử"
                          fields={[
                            { key: "bio", label: "Giới thiệu về bạn", placeholder: "Mô tả ngắn về bản thân...", value: inlineForm.bio, onChange: (v) => setInlineForm({ ...inlineForm, bio: v }), multiline: true },
                          ]}
                          onSave={() => saveInlineField("bio")}
                          onCancel={cancelInlineEdit}
                        />
                      ) : isSelf && !user.bio ? (
                        <AboutItemAdd label="Thêm tiểu sử" onClick={() => setEditingField("bio")} />
                      ) : !user.bio && <div style={{ color: "#b0b3b8", fontSize: 14 }}>Chưa có thông tin</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "posts" && (
              <>
                {isSelf && (
                  <div className="profile-create-post-card">
                    <div className="profile-create-post-header">
                      <div className="profile-create-post-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "white", fontWeight: 700 }}>
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="profile-create-post-input">
                        {user.name ? `Bạn đang nghĩ gì, ${user.name}?` : "Bạn đang nghĩ gì?"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="profile-posts-container">
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      reaction={postReactions[post._id] || null}
                      onSelectReaction={handleSelectReaction}
                      onClearReaction={handleClearReaction}
                    />
                  ))}
                  {isLoading && (
                    <div style={{ textAlign: "center", padding: "16px", color: "#B0B3B8" }}>
                      Đang tải...
                    </div>
                  )}
                  {!isLoading && posts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px", color: "#B0B3B8" }}>
                      {isSelf ? "Bạn chưa có bài viết nào." : "Người dùng này chưa có bài viết nào."}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "photos" && (
              <div className="profile-photos-tab">
                <div style={{ marginBottom: "12px", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontWeight: 700 }}>Ảnh</span>
                  <div style={{ display: "flex", gap: 8, background: "#242526", padding: "4px", borderRadius: 999 }}>
                    <button
                      className={`profile-tab-mini ${activePhotoTab === "authored" ? "profile-tab-mini--active" : ""}`}
                      onClick={() => setActivePhotoTab("authored")}
                    >
                      Ảnh của {isSelf ? "bạn" : "họ"}
                    </button>
                    <button
                      className={`profile-tab-mini ${activePhotoTab === "tagged" ? "profile-tab-mini--active" : ""}`}
                      onClick={() => setActivePhotoTab("tagged")}
                    >
                      Ảnh có mặt {isSelf ? "bạn" : "họ"}
                    </button>
                  </div>
                </div>

                {activePhotoTab === "authored" && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Ảnh của {isSelf ? "bạn" : user.name || "người này"}</div>
                    {photosAuthored.length > 0 ? (
                      <div className="profile-photos-grid">
                        {photosAuthored.map((photo) => (
                          <div key={`${photo.postId}-${photo.url}`} className="profile-photo-item">
                            <img src={photo.url} alt="photo" className="profile-photo-img" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="profile-widget-empty">Chưa có ảnh</div>
                    )}
                  </div>
                )}

                {activePhotoTab === "tagged" && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Ảnh có mặt {isSelf ? "bạn" : user.name || "người này"}</div>
                    {photosTagged.length > 0 ? (
                      <div className="profile-photos-grid">
                        {photosTagged.map((photo) => (
                          <div key={`${photo.postId}-${photo.url}`} className="profile-photo-item">
                            <img src={photo.url} alt="photo" className="profile-photo-img" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="profile-widget-empty">Chưa có ảnh được tag</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "friends" && (
              <div className="profile-friends-tab">
                <div style={{ marginBottom: "16px" }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "16px" }}>Bạn bè</h2>
                  
                  {/* Sub-tabs */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 4, background: "#242526", padding: "4px", borderRadius: 999, flexWrap: "wrap" }}>
                      {[
                        { key: "all", label: "Tất cả bạn bè" },
                        { key: "recent", label: "Đã thêm gần đây" },
                        { key: "birthdays", label: "Sinh nhật" },
                        { key: "college", label: "Đại học" },
                        { key: "city", label: "Tỉnh/Thành phố hiện tại" },
                        { key: "hometown", label: "Quê quán" },
                        { key: "following", label: "Đang theo dõi" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          className={`profile-tab-mini ${activeFriendsTab === tab.key ? "profile-tab-mini--active" : ""}`}
                          onClick={() => setActiveFriendsTab(tab.key as any)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Search and action buttons */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
                      <input
                        type="text"
                        placeholder="Tìm kiếm"
                        value={friendsSearchQuery}
                        onChange={(e) => setFriendsSearchQuery(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          background: "#3a3b3c",
                          border: "none",
                          borderRadius: 20,
                          color: "#e4e6eb",
                          fontSize: 14,
                          width: 200,
                        }}
                      />
                      {isSelf && (
                        <>
                          <button
                            className="profile-action-btn profile-action-btn--secondary"
                            style={{ fontSize: 14, padding: "8px 16px" }}
                            onClick={() => navigate("/friends/requests")}
                          >
                            Lời mời kết bạn
                          </button>
                          <button
                            className="profile-action-btn profile-action-btn--secondary"
                            style={{ fontSize: 14, padding: "8px 16px" }}
                            onClick={() => navigate("/friends/find")}
                          >
                            Tìm bạn bè
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Friends list */}
                {(() => {
                  let filteredFriends = friends;
                  
                  // Filter by search query
                  if (friendsSearchQuery.trim()) {
                    const query = friendsSearchQuery.toLowerCase();
                    filteredFriends = friends.filter(
                      (f) =>
                        f.name?.toLowerCase().includes(query) ||
                        f.email?.toLowerCase().includes(query) ||
                        f.username?.toLowerCase().includes(query)
                    );
                  }
                  
                  // Filter by sub-tab (simplified - can be enhanced with backend)
                  if (activeFriendsTab === "recent") {
                    // Sort by some date field if available, otherwise keep original order
                    filteredFriends = [...filteredFriends].reverse();
                  } else if (activeFriendsTab === "college" && user.colleges && user.colleges.length > 0) {
                    // Filter friends who went to same college (would need backend support)
                    filteredFriends = filteredFriends; // Placeholder
                  } else if (activeFriendsTab === "city" && user.currentCity) {
                    // Filter friends in same city (would need backend support)
                    filteredFriends = filteredFriends; // Placeholder
                  } else if (activeFriendsTab === "hometown" && user.hometown) {
                    // Filter friends from same hometown (would need backend support)
                    filteredFriends = filteredFriends; // Placeholder
                  }
                  
                  return filteredFriends.length > 0 ? (
                    <div className="profile-friends-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                      {filteredFriends.map((friend) => (
                        <div
                          key={friend._id}
                          className="profile-friend-card"
                          onClick={() => navigate(`/profile/${friend._id}`)}
                          style={{
                            cursor: "pointer",
                            background: "#242526",
                            borderRadius: 8,
                            overflow: "hidden",
                            transition: "transform 0.2s, box-shadow 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div className="profile-friend-avatar" style={{ width: "100%", aspectRatio: "1", overflow: "hidden" }}>
                            {friend.avatar ? (
                              <img
                                src={friend.avatar}
                                alt={friend.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "100%",
                                  height: "100%",
                                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: "48px",
                                }}
                              >
                                {friend.name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "12px" }}>
                            <div className="profile-friend-name" style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                              {friend.name || friend.email || "User"}
                            </div>
                            {/* Placeholder for mutual friends - would need backend API */}
                            {!isSelf && (
                              <div style={{ fontSize: 13, color: "#b0b3b8" }}>
                                {/* {mutualFriendsCount} bạn chung */}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-widget-empty" style={{ padding: "40px", textAlign: "center" }}>
                      {friendsSearchQuery.trim()
                        ? "Không tìm thấy bạn bè nào"
                        : isSelf
                        ? "Bạn chưa có bạn bè nào"
                        : "Chưa có bạn bè"}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "reels" && (
              <div className="profile-reels-tab">
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "16px", padding: "0 16px" }}>Reels</h2>
                {reelsLoading && reels.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#B0B3B8" }}>
                    Đang tải...
                  </div>
                ) : reels.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", padding: "0 16px" }}>
                    {reels.map((reel) => (
                      <div
                        key={reel._id}
                        onClick={() => router.push(`/reels?reel=${reel._id}`)}
                        style={{
                          cursor: "pointer",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "#242526",
                          position: "relative",
                          aspectRatio: "9/16",
                        }}
                      >
                        {reel.thumbnailUrl ? (
                          <img
                            src={reel.thumbnailUrl}
                            alt={reel.caption || "Reel"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <video
                            src={reel.videoUrl}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            muted
                            playsInline
                          />
                        )}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                            padding: "12px",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span>▶</span>
                            <span>{reel.viewCount || 0} lượt xem</span>
                          </div>
                          {reel.caption && (
                            <div style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {reel.caption}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#B0B3B8" }}>
                    {isSelf ? "Bạn chưa có reel nào." : "Người dùng này chưa có reel nào."}
                  </div>
                )}
                {reelsHasNext && (
                  <div style={{ textAlign: "center", padding: "16px" }}>
                    <button
                      onClick={() => loadReels(reelsNextCursor || undefined)}
                      disabled={reelsLoading}
                      style={{
                        padding: "8px 16px",
                        background: "#1877F2",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: reelsLoading ? "not-allowed" : "pointer",
                        opacity: reelsLoading ? 0.6 : 1,
                      }}
                    >
                      {reelsLoading ? "Đang tải..." : "Tải thêm"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showEditProfile && (
    <div className="modal-backdrop">
      <div className="modal-panel" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div className="modal-title">Chỉnh sửa chi tiết</div>
          <button className="modal-close" onClick={() => setShowEditProfile(false)}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="modal-field">
            <label>Tiểu sử</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Giới thiệu ngắn"
            />
          </div>
          <div className="modal-field">
            <label>Nơi làm việc (mỗi dòng một mục)</label>
            <textarea
              value={profileForm.works}
              onChange={(e) => setProfileForm({ ...profileForm, works: e.target.value })}
              placeholder="Công ty A\nCông ty B"
            />
          </div>
          <div className="modal-field">
            <label>Đại học / Cao đẳng (mỗi dòng một mục)</label>
            <textarea
              value={profileForm.colleges}
              onChange={(e) => setProfileForm({ ...profileForm, colleges: e.target.value })}
              placeholder="Trường đại học ..."
            />
          </div>
          <div className="modal-field">
            <label>Trung học (mỗi dòng một mục)</label>
            <textarea
              value={profileForm.highSchools}
              onChange={(e) => setProfileForm({ ...profileForm, highSchools: e.target.value })}
              placeholder="Trường THPT ..."
            />
          </div>
          <div className="modal-field">
            <label>Nơi ở hiện tại</label>
            <input
              value={profileForm.currentCity}
              onChange={(e) => setProfileForm({ ...profileForm, currentCity: e.target.value })}
              placeholder="Đà Nẵng"
            />
          </div>
          <div className="modal-field">
            <label>Quê quán</label>
            <input
              value={profileForm.hometown}
              onChange={(e) => setProfileForm({ ...profileForm, hometown: e.target.value })}
              placeholder="Quê quán"
            />
          </div>
          <div className="modal-field">
            <label>Tình trạng mối quan hệ</label>
            <input
              value={profileForm.relationshipStatus}
              onChange={(e) => setProfileForm({ ...profileForm, relationshipStatus: e.target.value })}
              placeholder="Độc thân / Hẹn hò / ..."
            />
          </div>
          <div className="modal-field">
            <label>Điện thoại</label>
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="Số điện thoại"
            />
          </div>
          <div className="modal-field">
            <label>Instagram</label>
            <input
              value={profileForm.instagram}
              onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className="modal-field">
            <label>Facebook</label>
            <input
              value={profileForm.facebook}
              onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
              placeholder="Link Facebook"
            />
          </div>
          <div className="modal-field">
            <label>Website</label>
            <input
              value={profileForm.website}
              onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn" onClick={() => setShowEditProfile(false)}>
            Hủy
          </button>
          <button
            className="modal-btn modal-btn--primary"
            onClick={async () => {
              try {
                await updateProfileApi({
                  bio: profileForm.bio,
                  works: profileForm.works.split("\n").map((s) => s.trim()).filter(Boolean),
                  colleges: profileForm.colleges.split("\n").map((s) => s.trim()).filter(Boolean),
                  highSchools: profileForm.highSchools.split("\n").map((s) => s.trim()).filter(Boolean),
                  currentCity: profileForm.currentCity,
                  hometown: profileForm.hometown,
                  relationshipStatus: profileForm.relationshipStatus,
                  phone: profileForm.phone,
                  instagram: profileForm.instagram,
                  facebook: profileForm.facebook,
                  website: profileForm.website,
                });
                await loadUser();
                setShowEditProfile(false);
              } catch (error) {
                console.error("Failed to update profile details:", error);
                alert("Cập nhật thất bại");
              }
            }}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )}
    </AppLayout>
    {avatarCropFile && (
      <AvatarCropModal
        imageFile={avatarCropFile}
        onClose={() => setAvatarCropFile(null)}
        onSave={handleAvatarCropSave}
      />
    )}
    </>
  );
};

const AboutItem = ({ icon, label, subLabel, isSelf, onEdit }: { icon: string; label: string; subLabel?: string; isSelf?: boolean; onEdit?: () => void }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #3a3b3c" }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, color: "#e4e6eb" }}>{label}</div>
      {subLabel && <div style={{ fontSize: 13, color: "#b0b3b8" }}>{subLabel}</div>}
    </div>
    {isSelf && onEdit && (
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onEdit}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", border: "none", color: "#e4e6eb", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Chỉnh sửa"
        >
          ✏️
        </button>
        <button
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", border: "none", color: "#e4e6eb", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          title="Thêm tùy chọn"
        >
          ⋯
        </button>
      </div>
    )}
  </div>
);

const AboutItemAdd = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      width: "100%",
      textAlign: "left",
    }}
  >
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3a3b3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2374e1" }}>
      ➕
    </div>
    <span style={{ fontSize: 15, color: "#2374e1" }}>{label}</span>
  </button>
);

type InlineField = {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
};

const InlineEditForm = ({
  title,
  fields,
  onSave,
  onCancel,
}: {
  title: string;
  fields: InlineField[];
  onSave: () => void;
  onCancel: () => void;
}) => (
  <div style={{ background: "#242526", border: "1px solid #3a3b3c", borderRadius: 8, padding: 16, marginBottom: 8 }}>
    <h4 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px" }}>{title}</h4>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {fields.map((field) => (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#b0b3b8" }}>{field.label}</label>
          {field.multiline ? (
            <textarea
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{
                background: "#3a3b3c",
                border: "1px solid #4e4f50",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#e4e6eb",
                fontSize: 15,
                resize: "vertical",
                minHeight: 80,
                outline: "none",
              }}
            />
          ) : (
            <input
              type="text"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{
                background: "#3a3b3c",
                border: "1px solid #4e4f50",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#e4e6eb",
                fontSize: 15,
                outline: "none",
              }}
            />
          )}
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
      <button
        onClick={onCancel}
        style={{
          padding: "8px 16px",
          background: "#3a3b3c",
          border: "none",
          borderRadius: 6,
          color: "#e4e6eb",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Hủy
      </button>
      <button
        onClick={onSave}
        style={{
          padding: "8px 16px",
          background: "#2374e1",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Lưu
      </button>
    </div>
  </div>
);

export default Profile;

