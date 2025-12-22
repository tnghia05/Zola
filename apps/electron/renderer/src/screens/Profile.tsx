import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  reactToPostApi,
  removeReactionApi,
  ReactionType,
} from "@zola/app/api";
import { AppLayout } from "@zola/app/components/AppLayout";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";
import { ProfileHeader } from "./profile/ProfileHeader";
import { ProfileSidebar } from "./profile/ProfileSidebar";
import { ProfilePostsTab } from "./profile/ProfilePostsTab";
import { ProfileAboutTab } from "./profile/ProfileAboutTab";
import { ProfilePhotosTab } from "./profile/ProfilePhotosTab";
import { ProfileFriendsTab } from "./profile/ProfileFriendsTab";
import { ProfileReelsTab } from "./profile/ProfileReelsTab";
import { ProfileEditModal } from "./profile/ProfileEditModal";

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
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
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            const oldReaction = postReactions[postId];
            const newReaction = reaction;
            const reactionCounts = { ...(p.reactionCounts || {}) };
            
            if (oldReaction) {
              reactionCounts[oldReaction] = Math.max(0, (reactionCounts[oldReaction] || 0) - 1);
            }
            
            reactionCounts[newReaction] = (reactionCounts[newReaction] || 0) + 1;
            
            return {
              ...p,
              reactionCounts,
              likeCount: (Object.values(reactionCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0),
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
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId && oldReaction) {
            const reactionCounts = { ...(p.reactionCounts || {}) };
            reactionCounts[oldReaction] = Math.max(0, (reactionCounts[oldReaction] || 0) - 1);
            return {
              ...p,
              reactionCounts,
              likeCount: (Object.values(reactionCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0),
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
        const data = await getFriends();
        if (Array.isArray(data.friendIds) && data.friendIds.includes(targetUserId)) {
          setIsFriend(true);
        }
        return;
      }
  
      const data = await getFriends();
      if (Array.isArray(data.friendIds) && data.friendIds.length > 0) {
        const users = await getUsersByIds(data.friendIds);
        setFriends(users.users || []);
      } else {
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCover(true);
    try {
      const result = await uploadMediaApi(file);
      if (result.url) {
        const updatedUser = await updateProfileApi({ coverImage: result.url });
        if (updatedUser) {
          setUser((prev: any) => prev ? { ...prev, coverImage: updatedUser.coverImage || result.url } : { ...updatedUser, coverImage: result.url });
        }
        await loadUser();
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
    if (!file || !file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh");
      return;
    }
    setAvatarCropFile(file);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleAvatarCropSave = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true);
    try {
      const croppedFile = new File([croppedBlob], "avatar.png", { type: "image/png" });
      const result = await uploadMediaApi(croppedFile);
      if (result.url) {
        const updatedUser = await updateProfileApi({ avatar: result.url });
        if (updatedUser) {
          setUser((prev: any) => prev ? { ...prev, avatar: updatedUser.avatar || result.url } : { ...updatedUser, avatar: result.url });
        }
        await loadUser();
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Không thể tải ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
      setAvatarCropFile(null);
    }
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

  const handleSaveProfile = async () => {
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
          navigate("/login");
        }
      }}
    />
  );

  return (
    <>
      <AppLayout header={header} hideSidebars={true}>
        <div className="profile-container">
          <ProfileHeader
            user={user}
            isSelf={isSelf}
            isBlocked={isBlocked}
            hasBlockedYou={hasBlockedYou}
            isFriend={isFriend}
            friendRequestSent={friendRequestSent}
            isSendingRequest={isSendingRequest}
            isUploadingCover={isUploadingCover}
            isUploadingAvatar={isUploadingAvatar}
            avatarCropFile={avatarCropFile}
            coverInputRef={coverInputRef}
            avatarInputRef={avatarInputRef}
            handleCoverUpload={handleCoverUpload}
            handleAvatarFileSelect={handleAvatarFileSelect}
            handleAvatarCropSave={handleAvatarCropSave}
            setAvatarCropFile={setAvatarCropFile}
            handleSendFriendRequest={handleSendFriendRequest}
            handleBlock={handleBlock}
            handleUnblock={handleUnblock}
            handleUnfriend={handleUnfriend}
            targetUserId={targetUserId}
            navigate={navigate}
            onNavigate={navigate}
          />

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

          <div className="profile-content" style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "16px" }}>
            <ProfileSidebar
              user={user}
              isSelf={isSelf}
              userPhotos={userPhotos}
              displayFriends={displayFriends}
              friends={friends}
              setShowEditProfile={setShowEditProfile}
            />

            <div className="profile-right-column" style={{ flex: 1, minWidth: 0 }} ref={listRef}>
              {activeTab === "posts" && (
                <ProfilePostsTab
                  user={user}
                  isSelf={isSelf}
                  posts={posts}
                  isLoading={isLoading}
                  postReactions={postReactions}
                  handleSelectReaction={handleSelectReaction}
                  handleClearReaction={handleClearReaction}
                />
              )}

              {activeTab === "about" && (
                <ProfileAboutTab
                  user={user}
                  isSelf={isSelf}
                  inlineForm={inlineForm}
                  setInlineForm={setInlineForm}
                  editingField={editingField}
                  setEditingField={setEditingField}
                  saveInlineField={saveInlineField}
                  cancelInlineEdit={cancelInlineEdit}
                />
              )}

              {activeTab === "photos" && (
                <ProfilePhotosTab
                  user={user}
                  isSelf={isSelf}
                  photosAuthored={photosAuthored}
                  photosTagged={photosTagged}
                  activePhotoTab={activePhotoTab}
                  setActivePhotoTab={setActivePhotoTab}
                />
              )}

              {activeTab === "friends" && (
                <ProfileFriendsTab
                  user={user}
                  isSelf={isSelf}
                  friends={friends}
                  activeFriendsTab={activeFriendsTab}
                  setActiveFriendsTab={setActiveFriendsTab}
                  friendsSearchQuery={friendsSearchQuery}
                  setFriendsSearchQuery={setFriendsSearchQuery}
                />
              )}

              {activeTab === "reels" && (
                <ProfileReelsTab
                  user={user}
                  isSelf={isSelf}
                  reels={reels}
                  reelsLoading={reelsLoading}
                  reelsHasNext={reelsHasNext}
                  reelsNextCursor={reelsNextCursor}
                  loadReels={loadReels}
                />
              )}
            </div>
          </div>
        </div>
      </AppLayout>

      <ProfileEditModal
        show={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        onSave={handleSaveProfile}
      />
    </>
  );
};

export default Profile;
