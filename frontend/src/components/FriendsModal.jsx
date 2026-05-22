import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock, 
  Send,
  Loader2,
  Search,
  MessageCircle
} from "lucide-react";
import axiosClient from "../axiosClient.js";
import FriendChat from "./FriendChat.jsx";

const FriendsModal = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("friends");
  const [chatFriend, setChatFriend] = useState(null);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/user/me");
      setUserData(res.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen, fetchUserData]);

  // Handle ESC key and body scroll
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // --- Send Friend Request ---
  const handleSendRequest = async () => {
    if (!search.trim()) {
      showMessage("Please enter a username", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post("/api/user/friends", {
        username: search.trim(),
      });
      showMessage(res.data.message || "Friend request sent!", "success");
      setSearch("");
      await fetchUserData();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Player not found or request failed";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Accept Friend Request ---
  const handleAcceptRequest = async (requesterId) => {
    try {
      setLoading(true);
      const res = await axiosClient.post("/api/user/friends/accept", {
        userId: requesterId,
      });
      showMessage(res.data.message || "Friend request accepted!", "success");
      await fetchUserData();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to accept request";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Reject Friend Request ---
  const handleRejectRequest = async (requesterId) => {
    try {
      setLoading(true);
      const res = await axiosClient.post("/api/user/friends/reject", {
        userId: requesterId,
      });
      showMessage(res.data.message || "Friend request rejected", "info");
      await fetchUserData();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to reject request";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Cancel Outgoing Request ---
  const handleCancelRequest = async (targetId) => {
    try {
      setLoading(true);
      const res = await axiosClient.post("/api/user/friends/cancel", {
        userId: targetId,
      });
      showMessage(res.data.message || "Request cancelled", "info");
      await fetchUserData();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to cancel request";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Remove Friend ---
  const handleRemoveFriend = async (friendId) => {
    try {
      setLoading(true);
      const res = await axiosClient.post("/api/user/friends/remove", {
        userId: friendId,
      });
      showMessage(res.data.message || "Friend removed", "info");
      await fetchUserData();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to remove friend";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Get counts for tabs
  const incomingCount = userData?.incomingRequests?.length || 0;
  const outgoingCount = userData?.outgoingRequests?.length || 0;
  const friendsCount = userData?.friends?.length || 0;

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-[#1A1714]/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-md card overflow-hidden max-h-[85vh] flex flex-col animate-scaleIn pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-border bg-gradient-to-r from-violet-soft to-emerald-soft">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet/10 rounded-full blur-3xl" />
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-text">Friends</h2>
                  <p className="text-sm text-text-secondary">{friendsCount} friends</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-bg-deep hover:bg-accent-soft hover:text-accent transition-colors text-text-muted"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-border bg-surface">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Add friend by username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                  className="input pl-10 py-2.5"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleSendRequest}
                disabled={loading || !search.trim()}
                className="btn-primary px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            
            {/* Message Toast */}
            {message.text && (
              <div className={`mt-3 px-4 py-2.5 rounded-xl text-sm font-medium animate-fadeIn ${
                message.type === "success" 
                  ? "bg-emerald-soft text-emerald border border-emerald/20" 
                  : message.type === "error"
                  ? "bg-accent-soft text-accent border border-accent/20"
                  : "bg-bg-deep text-text-secondary border border-border"
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-bg-deep">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "friends" 
                  ? "text-text" 
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <UserCheck size={16} />
                Friends
                {friendsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-emerald-soft text-emerald rounded-full">
                    {friendsCount}
                  </span>
                )}
              </span>
              {activeTab === "friends" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "incoming" 
                  ? "text-text" 
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus size={16} />
                Incoming
                {incomingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-accent-soft text-accent rounded-full animate-pulse">
                    {incomingCount}
                  </span>
                )}
              </span>
              {activeTab === "incoming" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("outgoing")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "outgoing" 
                  ? "text-text" 
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Clock size={16} />
                Pending
                {outgoingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-amber-soft text-amber rounded-full">
                    {outgoingCount}
                  </span>
                )}
              </span>
              {activeTab === "outgoing" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!userData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            ) : (
              <>
                {/* Friends Tab */}
                {activeTab === "friends" && (
                  <div className="space-y-2">
                    {userData.friends?.length === 0 ? (
                      <EmptyState 
                        icon={<Users className="w-10 h-10" />}
                        title="No friends yet"
                        description="Add friends by searching their username above"
                      />
                    ) : (
                      userData.friends?.map((friend) => (
                        <UserCard
                          key={friend._id || friend.userId || friend}
                          user={friend}
                          actions={
                            <div className="flex gap-2">
                              <button
                                onClick={() => setChatFriend(friend)}
                                className="px-3 py-1.5 text-xs font-medium bg-violet-soft hover:bg-violet text-violet hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                              >
                                <MessageCircle size={14} />
                                Chat
                              </button>
                              <button
                                onClick={() => handleRemoveFriend(friend._id || friend.userId)}
                                disabled={loading}
                                className="px-3 py-1.5 text-xs font-medium bg-bg-deep hover:bg-accent-soft hover:text-accent text-text-muted rounded-lg transition-colors disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {/* Incoming Requests Tab */}
                {activeTab === "incoming" && (
                  <div className="space-y-2">
                    {userData.incomingRequests?.length === 0 ? (
                      <EmptyState 
                        icon={<UserPlus className="w-10 h-10" />}
                        title="No incoming requests"
                        description="When someone adds you, they'll appear here"
                      />
                    ) : (
                      userData.incomingRequests?.map((user) => (
                        <UserCard
                          key={user._id || user.userId || user}
                          user={user}
                          actions={
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(user._id || user.userId)}
                                disabled={loading}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald text-white hover:bg-emerald/90 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(user._id || user.userId)}
                                disabled={loading}
                                className="px-3 py-1.5 text-xs font-medium bg-bg-deep hover:bg-accent-soft hover:text-accent text-text-muted rounded-lg transition-colors disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {/* Outgoing Requests Tab */}
                {activeTab === "outgoing" && (
                  <div className="space-y-2">
                    {userData.outgoingRequests?.length === 0 ? (
                      <EmptyState 
                        icon={<Clock className="w-10 h-10" />}
                        title="No pending requests"
                        description="Requests you've sent will appear here"
                      />
                    ) : (
                      userData.outgoingRequests?.map((user) => (
                        <UserCard
                          key={user._id || user.userId || user}
                          user={user}
                          actions={
                            <button
                              onClick={() => handleCancelRequest(user._id || user.userId)}
                              disabled={loading}
                              className="px-3 py-1.5 text-xs font-medium bg-bg-deep hover:bg-accent-soft hover:text-accent text-text-muted rounded-lg transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Friend Chat - Renders outside the modal */}
      {chatFriend && (
        <FriendChat 
          friend={chatFriend} 
          onClose={() => setChatFriend(null)} 
        />
      )}
    </>,
    document.body
  );
};

// User Card Component
const UserCard = ({ user, actions }) => {
  const username = user?.username || user;
  const pfpUrl = user?.pfp_url;
  
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-bg-deep rounded-xl border border-border hover:border-border-strong transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {pfpUrl ? (
          <img
            src={pfpUrl}
            alt={username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-violet-soft flex items-center justify-center ring-2 ring-border">
            <span className="text-violet font-display font-semibold">
              {username?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-text truncate">{username}</p>
          <p className="text-xs text-text-muted">Online</p>
        </div>
      </div>
      {actions}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-bg-deep flex items-center justify-center text-text-muted mb-4">
      {icon}
    </div>
    <h3 className="font-display font-semibold text-text mb-1">{title}</h3>
    <p className="text-sm text-text-muted max-w-[200px]">{description}</p>
  </div>
);

export default FriendsModal;
