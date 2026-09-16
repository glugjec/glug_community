import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Shield,
  Users,
  BookOpen,
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Check,
  Copy,
  Plus,
  Edit3,
  Activity,
  Eye,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Server,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  ArrowUp,
  Crown,
  Award,
  UserPlus,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Flag,
  UserX,
  RotateCcw,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { adminApi, resourcesApi } from "../api.js";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import { avatarInitials, avatarColor } from "../components/common/avatar.js";
import MarkdownRenderer from "../components/common/MarkdownRenderer.jsx";
import "./AdminDashboard.css";

function stripHtml(str = "") {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function AdminUserAvatar({ src, username }) {
  const [error, setError] = useState(false);
  const name = username || 'User';

  useEffect(() => {
    setError(false);
  }, [src]);

  const isValid = Boolean(
    src && typeof src === 'string' && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))
  );

  if (isValid && !error) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="admin-user-avatar"
      />
    );
  }

  return (
    <div
      className="admin-user-avatar fallback"
      style={{
        background: avatarColor(name),
        color: '#ffffff',
      }}
    >
      {avatarInitials(name)}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalResources: 0,
    adminCount: 0,
    todayPosts: 0,
  });
  const [refreshingStats, setRefreshingStats] = useState(false);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const [resources, setResources] = useState([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "getting-started",
    items: "",
  });

  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("all");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingAdminPost, setIsDeletingAdminPost] = useState(false);
  const [previewingPost, setPreviewingPost] = useState(null);

  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({
    userId: "",
    category: "Team Lead",
    positionTitle: "",
    teamDomain: "Technical",
    order: 10,
  });

  const [memberPickerSearch, setMemberPickerSearch] = useState("");

  // Moderation state
  const [modSubTab, setModSubTab] = useState("flagged"); // 'flagged' | 'reports' | 'banned' | 'logs' | 'discussions'
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  const [appealStatusFilter, setAppealStatusFilter] = useState("pending");
  const [appealCategoryFilter, setAppealCategoryFilter] = useState("all");
  const [appealToResolve, setAppealToResolve] = useState(null);
  const [appealResolveForm, setAppealResolveForm] = useState({
    status: "approved",
    adminNotes: "",
    restoreContent: true,
    decrementStrike: true,
  });
  const [isResolvingAppeal, setIsResolvingAppeal] = useState(false);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [bannedUsersList, setBannedUsersList] = useState([]);
  const [loadingBanned, setLoadingBanned] = useState(false);
  const [modLogs, setModLogs] = useState([]);
  const [loadingModLogs, setLoadingModLogs] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState("all");

  // Moderation modals
  const [banUserModalTarget, setBanUserModalTarget] = useState(null);
  const [banForm, setBanForm] = useState({ reason: '', hours: '' });
  const [isBanning, setIsBanning] = useState(false);

  const [unbanTarget, setUnbanTarget] = useState(null);
  const [unbanResetStrikes, setUnbanResetStrikes] = useState(true);
  const [isUnbanning, setIsUnbanning] = useState(false);

  const [overrideReportTarget, setOverrideReportTarget] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ newStatus: 'confirmed', action: 'none', applyStrike: false, reason: '' });
  const [isOverriding, setIsOverriding] = useState(false);

  const [itemToRestore, setItemToRestore] = useState(null);
  const [isRestoringItem, setIsRestoringItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingFlaggedItem, setIsDeletingFlaggedItem] = useState(false);

  const [viewItemModal, setViewItemModal] = useState(null);
  const [expandedTextMap, setExpandedTextMap] = useState({});
  const toggleTextExpanded = (id) => {
    setExpandedTextMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectableUsers = useMemo(() => {
    const q = memberPickerSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      const usernameMatch = u.username?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      return usernameMatch || emailMatch;
    });
  }, [users, memberPickerSearch]);

  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadTeamMembers() {
    try {
      setLoadingTeam(true);
      const res = await adminApi.getTeamMembers();
      setTeamMembers(res.team || []);
    } catch (err) {
      showToast(err.message || "Failed to load team members", "error");
    } finally {
      setLoadingTeam(false);
    }
  }

  function openTeamModal(member = null) {
    setMemberPickerSearch("");
    if (!member) {
      adminApi
        .getUsers({ limit: 150 })
        .then((data) => {
          if (data?.users) setUsers(data.users);
        })
        .catch(() => {});
    }

    if (member) {
      setEditingTeamMember(member);
      setTeamForm({
        userId: member.id,
        category: member.communityRole?.category || "Team Lead",
        positionTitle: member.communityRole?.positionTitle || "",
        teamDomain: member.communityRole?.teamDomain || "Technical",
        order: member.communityRole?.order ?? 10,
      });
    } else {
      setEditingTeamMember(null);
      setTeamForm({
        userId: "",
        category: "Team Lead",
        positionTitle: "",
        teamDomain: "Technical",
        order: 10,
      });
    }
    setTeamModalOpen(true);
  }

  async function handleSaveTeamPosition(e) {
    e.preventDefault();
    if (!teamForm.userId) {
      showToast("Please select a community member", "error");
      return;
    }
    try {
      setIsSavingTeam(true);
      await adminApi.updateTeamPosition(teamForm.userId, {
        category: teamForm.category,
        positionTitle: teamForm.positionTitle,
        teamDomain: teamForm.teamDomain,
        order: Number(teamForm.order) || 10,
      });
      showToast("Team position updated successfully", "success");
      setTeamModalOpen(false);
      loadTeamMembers();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to update team position", "error");
    } finally {
      setIsSavingTeam(false);
    }
  }

  async function handleRemoveTeamMember() {
    if (!memberToRemove) return;
    try {
      setIsRemovingMember(true);
      await adminApi.removeTeamMember(memberToRemove.id);
      showToast("Member removed from community team", "success");
      setMemberToRemove(null);
      loadTeamMembers();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to remove member", "error");
    } finally {
      setIsRemovingMember(false);
    }
  }

  async function loadStats() {
    if (!user || user.role !== "admin") return;
    setRefreshingStats(true);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      showToast(err.message || "Failed to load dashboard metrics", "error");
    } finally {
      setRefreshingStats(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, [user]);

  useEffect(() => {
    if (user && user.role === "admin" && (activeTab === "team" || activeTab === "overview")) {
      loadTeamMembers();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && user.role === "admin" && (activeTab === "users" || activeTab === "team")) {
      if (users.length === 0) setLoadingUsers(true);
      const params = {};
      if (userSearch.trim()) params.q = userSearch.trim();
      if (userRoleFilter !== "all") params.role = userRoleFilter;

      adminApi
        .getUsers(params)
        .then((data) => setUsers(data.users || []))
        .catch((err) => showToast(err.message, "error"))
        .finally(() => setLoadingUsers(false));
    }
  }, [user, activeTab, userSearch, userRoleFilter]);

  useEffect(() => {
    if (user && user.role === "admin") {
      resourcesApi
        .list()
        .then((data) => setResources(data || []))
        .catch((err) => showToast(err.message, "error"));
    }
  }, [user]);

  const loadFlaggedItems = async () => {
    setLoadingFlagged(true);
    try {
      const data = await adminApi.getFlaggedContent();
      setFlaggedItems(data.items || []);
    } catch (err) {
      showToast(err.message || "Failed to load flagged content", "error");
    } finally {
      setLoadingFlagged(false);
    }
  };

  const loadAppeals = async (statusOverride) => {
    setLoadingAppeals(true);
    try {
      const activeFilter = typeof statusOverride === "string" ? statusOverride : appealStatusFilter;
      const res = await adminApi.getAppeals({ status: activeFilter });
      setAppeals(res.appeals || []);
    } catch (err) {
      showToast(err.message || "Failed to load appeals", "error");
    } finally {
      setLoadingAppeals(false);
    }
  };

  const handleResolveAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealToResolve) return;

    setIsResolvingAppeal(true);
    try {
      const res = await adminApi.resolveAppeal(appealToResolve.id || appealToResolve._id, appealResolveForm);
      showToast(res.message || "Appeal resolved successfully", "success");
      setAppealToResolve(null);
      loadAppeals();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to resolve appeal", "error");
    } finally {
      setIsResolvingAppeal(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const params = {};
      if (reportStatusFilter !== "all") params.status = reportStatusFilter;
      const data = await adminApi.getReports(params);
      setReports(data.reports || []);
    } catch (err) {
      showToast(err.message || "Failed to load reports", "error");
    } finally {
      setLoadingReports(false);
    }
  };

  const loadBannedUsers = async () => {
    setLoadingBanned(true);
    try {
      const data = await adminApi.getBannedUsers();
      setBannedUsersList(data.users || []);
    } catch (err) {
      showToast(err.message || "Failed to load banned users", "error");
    } finally {
      setLoadingBanned(false);
    }
  };

  const loadModLogs = async () => {
    setLoadingModLogs(true);
    try {
      const data = await adminApi.getModerationLogs();
      setModLogs(data.logs || []);
    } catch (err) {
      showToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setLoadingModLogs(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "moderation") {
      if (modSubTab === "flagged") loadFlaggedItems();
      else if (modSubTab === "reports") loadReports();
      else if (modSubTab === "appeals") loadAppeals();
      else if (modSubTab === "banned") loadBannedUsers();
      else if (modSubTab === "logs") loadModLogs();
      else if (modSubTab === "discussions") {
        if (posts.length === 0) setLoadingPosts(true);
        const params = {};
        if (postSearch.trim()) params.q = postSearch.trim();
        adminApi
          .getPosts(params)
          .then((data) => setPosts(data.posts || []))
          .catch((err) => showToast(err.message, "error"))
          .finally(() => setLoadingPosts(false));
      }
    }
  }, [user, activeTab, modSubTab, reportStatusFilter, appealStatusFilter, postSearch]);

  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "moderation" && modSubTab === "appeals") {
      const interval = setInterval(() => {
        if (!document.hidden) {
          loadAppeals();
          loadStats();
        }
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [user, activeTab, modSubTab, appealStatusFilter]);

  const handleConfirmRestoreItem = async () => {
    if (!itemToRestore) return;
    setIsRestoringItem(true);
    try {
      if (itemToRestore.itemType === "post") {
        await adminApi.restoreFlaggedPost(itemToRestore.id);
      } else {
        await adminApi.restoreFlaggedComment(itemToRestore.id);
      }
      showToast(`Restored ${itemToRestore.itemType} to public view`);
      setItemToRestore(null);
      loadFlaggedItems();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to restore content", "error");
    } finally {
      setIsRestoringItem(false);
    }
  };

  const handleConfirmDeleteFlaggedItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingFlaggedItem(true);
    try {
      if (itemToDelete.itemType === "post") {
        await adminApi.deleteFlaggedPost(itemToDelete.id);
      } else {
        await adminApi.deleteFlaggedComment(itemToDelete.id);
      }
      showToast(`Deleted ${itemToDelete.itemType} permanently`);
      setItemToDelete(null);
      loadFlaggedItems();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to delete item", "error");
    } finally {
      setIsDeletingFlaggedItem(false);
    }
  };

  const handleConfirmBanUser = async (e) => {
    e.preventDefault();
    if (!banUserModalTarget) return;
    setIsBanning(true);
    try {
      await adminApi.banUser(banUserModalTarget.id, banForm);
      showToast(`User @${banUserModalTarget.username} has been banned`);
      setBanUserModalTarget(null);
      setBanForm({ reason: '', hours: '' });
      loadStats();
      if (modSubTab === "banned") loadBannedUsers();
      if (activeTab === "users") {
        const data = await adminApi.getUsers();
        setUsers(data.users || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to ban user", "error");
    } finally {
      setIsBanning(false);
    }
  };

  const handleConfirmUnban = async () => {
    if (!unbanTarget) return;
    setIsUnbanning(true);
    try {
      await adminApi.unbanUser(unbanTarget.id, { resetStrikes: unbanResetStrikes });
      showToast(`User @${unbanTarget.username} unbanned`);
      setUnbanTarget(null);
      loadStats();
      if (modSubTab === "banned") loadBannedUsers();
      if (activeTab === "users") {
        const data = await adminApi.getUsers();
        setUsers(data.users || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to unban user", "error");
    } finally {
      setIsUnbanning(false);
    }
  };

  const handleConfirmOverride = async (e) => {
    e.preventDefault();
    if (!overrideReportTarget) return;
    setIsOverriding(true);
    try {
      await adminApi.overrideReport(overrideReportTarget.id, overrideForm);
      showToast("Report status updated successfully");
      setOverrideReportTarget(null);
      loadReports();
      loadStats();
    } catch (err) {
      showToast(err.message || "Failed to override report", "error");
    } finally {
      setIsOverriding(false);
    }
  };

  function copyToClipboard(text, id) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmail(id);
      setTimeout(() => setCopiedEmail(null), 2000);
      showToast("Email address copied to clipboard");
    });
  }

  async function confirmRoleChange() {
    if (!roleChangeTarget) return;
    const newRole = roleChangeTarget.role === "admin" ? "student" : "admin";
    setIsUpdatingRole(true);
    try {
      await adminApi.updateUserRole(roleChangeTarget.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === roleChangeTarget.id ? { ...u, role: newRole } : u))
      );
      showToast(`Updated @${roleChangeTarget.username} to ${newRole}`);
      setRoleChangeTarget(null);
      loadStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsUpdatingRole(false);
    }
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await adminApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showToast(`User @${userToDelete.username} deleted`);
      setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
      setUserToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingUser(false);
    }
  }

  async function handleSaveResource(e) {
    e.preventDefault();
    const itemArray = resourceForm.items
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingResource) {
        const updated = await resourcesApi.update(editingResource.id, {
          title: resourceForm.title,
          description: resourceForm.description,
          category: resourceForm.category,
          items: itemArray,
        });
        setResources((prev) =>
          prev.map((r) => (r.id === editingResource.id ? updated : r))
        );
        showToast("Resource topic updated");
      } else {
        const created = await resourcesApi.create({
          title: resourceForm.title,
          description: resourceForm.description,
          category: resourceForm.category,
          items: itemArray,
        });
        setResources((prev) => [created, ...prev]);
        showToast("Resource topic published");
        setStats((prev) => ({ ...prev, totalResources: prev.totalResources + 1 }));
      }
      setResourceModalOpen(false);
      setEditingResource(null);
      setResourceForm({ title: "", description: "", category: "getting-started", items: "" });
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function confirmDeleteResource() {
    if (!resourceToDelete) return;
    setIsDeletingResource(true);
    try {
      await resourcesApi.delete(resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      showToast("Resource topic deleted");
      setStats((prev) => ({ ...prev, totalResources: Math.max(0, prev.totalResources - 1) }));
      setResourceToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingResource(false);
    }
  }

  async function handleTogglePin(post) {
    try {
      const res = await adminApi.togglePinPost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isPinned: res.isPinned } : p))
      );
      showToast(res.isPinned ? "Discussion pinned to top" : "Discussion unpinned");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleToggleLock(post) {
    try {
      const res = await adminApi.toggleLockPost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isLocked: res.isLocked } : p))
      );
      showToast(res.isLocked ? "Discussion locked from replies" : "Discussion unlocked");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function confirmDeletePost() {
    if (!postToDelete) return;
    setIsDeletingAdminPost(true);
    try {
      await adminApi.deletePost(postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      showToast("Post and associated comments removed");
      setStats((prev) => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
      setPostToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingAdminPost(false);
    }
  }

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading-state">
          <RefreshCw className="admin-spinner" size={28} />
          <p>Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-page">
        <div className="admin-denied-card">
          <div className="admin-denied-icon-wrap">
            <AlertCircle size={44} />
          </div>
          <h2>Administrator Access Required</h2>
          <p>
            You must be signed in with an administrator account to view the GLUG
            administration console.
          </p>
          <Link to="/" className="admin-primary-btn">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter((p) => {
    if (postCategoryFilter === "all") return true;
    return (p.category || "").toLowerCase() === postCategoryFilter.toLowerCase();
  });

  const studentCount = Math.max(0, (stats.totalUsers || 0) - (stats.adminCount || 0));

  return (
    <section className="admin-page">
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <header className="admin-header">
        <div className="admin-header-main">
          <div className="admin-title-badge">
            <Shield className="admin-badge-icon" size={20} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="admin-title">GLUG Administration Console</h1>
          <p className="admin-subtitle">
            Manage student community members, curate learning curriculum, moderate discussions, and monitor platform activity.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={loadStats}
            disabled={refreshingStats}
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={15} className={refreshingStats ? "admin-spin" : ""} />
            <span>Refresh Stats</span>
          </button>
          <Link to="/forum" className="admin-secondary-btn" title="Open Forum">
            <ExternalLink size={15} />
            <span>Open Forum</span>
          </Link>
        </div>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Members</span>
            <div className="admin-stat-icon-wrap user-theme">
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalUsers}</span>
            <span className="admin-stat-subtext">Registered accounts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Forum Discussions</span>
            <div className="admin-stat-icon-wrap post-theme">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalPosts}</span>
            <span className="admin-stat-subtext">
              {stats.todayPosts || 0} created today
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Comments</span>
            <div className="admin-stat-icon-wrap comment-theme">
              <Layers size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalComments}</span>
            <span className="admin-stat-subtext">Community replies</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Curated Resources</span>
            <div className="admin-stat-icon-wrap resource-theme">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalResources}</span>
            <span className="admin-stat-subtext">Published learning topics</span>
          </div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => {
            setSearchParams({ tab: "moderation" });
            setModSubTab("flagged");
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Flagged Content</span>
            <div className="admin-stat-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value" style={{ color: (stats.flaggedCount || 0) > 0 ? "#ef4444" : "inherit" }}>
              {stats.flaggedCount || 0}
            </span>
            <span className="admin-stat-subtext">Hidden from public</span>
          </div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => {
            setSearchParams({ tab: "moderation" });
            setModSubTab("banned");
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Banned Users</span>
            <div className="admin-stat-icon-wrap" style={{ background: "rgba(234, 179, 8, 0.15)", color: "#eab308" }}>
              <UserX size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.bannedUsersCount || 0}</span>
            <span className="admin-stat-subtext">Suspended accounts</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs-nav">
        <nav className="admin-tabs" aria-label="Admin Sections">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "overview" })}
          >
            <TrendingUp size={16} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "team" })}
          >
            <Crown size={16} />
            <span>Community Team</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "users" })}
          >
            <Users size={16} />
            <span>Users</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "moderation" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "moderation" })}
          >
            <ShieldAlert size={16} />
            <span>Moderation</span>
            {(stats.flaggedCount || 0) > 0 && (
              <span
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "0.72rem",
                  marginLeft: "6px",
                  fontWeight: 600,
                }}
              >
                {stats.flaggedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "resources" })}
          >
            <BookOpen size={16} />
            <span>Resources</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "system" })}
          >
            <Server size={16} />
            <span>System & Security</span>
          </button>
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="admin-tab-content">
          <div className="admin-overview-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Activity size={18} />
                  <span>Platform Distribution</span>
                </h3>
              </div>
              <div className="admin-distribution-list">
                <div className="admin-distribution-row">
                  <div className="admin-distribution-info">
                    <UserCheck size={16} className="text-blue" />
                    <span>Students</span>
                  </div>
                  <div className="admin-distribution-bar-wrap">
                    <div
                      className="admin-distribution-bar student-bar"
                      style={{
                        width: stats.totalUsers > 0 ? `${(studentCount / stats.totalUsers) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="admin-distribution-val">{studentCount}</span>
                </div>

                <div className="admin-distribution-row">
                  <div className="admin-distribution-info">
                    <ShieldCheck size={16} className="text-gold" />
                    <span>Administrators</span>
                  </div>
                  <div className="admin-distribution-bar-wrap">
                    <div
                      className="admin-distribution-bar admin-bar"
                      style={{
                        width: stats.totalUsers > 0 ? `${((stats.adminCount || 0) / stats.totalUsers) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="admin-distribution-val">{stats.adminCount || 0}</span>
                </div>

                <div className="admin-distribution-row">
                  <div className="admin-distribution-info">
                    <Calendar size={16} className="text-emerald" />
                    <span>Today's Posts</span>
                  </div>
                  <div className="admin-distribution-bar-wrap">
                    <div
                      className="admin-distribution-bar today-bar"
                      style={{
                        width: stats.totalPosts > 0 ? `${Math.min(100, ((stats.todayPosts || 0) / stats.totalPosts) * 100)}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="admin-distribution-val">{stats.todayPosts || 0}</span>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Shield size={18} />
                  <span>Quick Administrative Actions</span>
                </h3>
              </div>
              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="admin-quick-action-btn"
                  onClick={() => setSearchParams({ tab: "users" })}
                >
                  <Users size={16} />
                  <div className="admin-quick-action-text">
                    <strong>Manage Users</strong>
                    <span>Search members and update roles</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="admin-quick-action-btn"
                  onClick={() => setSearchParams({ tab: "moderation" })}
                >
                  <MessageSquare size={16} />
                  <div className="admin-quick-action-text">
                    <strong>Moderate Forum</strong>
                    <span>Pin, lock, or delete discussions</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="admin-quick-action-btn"
                  onClick={() => {
                    setSearchParams({ tab: "resources" });
                    setEditingResource(null);
                    setResourceForm({ title: "", description: "", category: "getting-started", items: "" });
                    setResourceModalOpen(true);
                  }}
                >
                  <Plus size={16} />
                  <div className="admin-quick-action-text">
                    <strong>Publish Resource Topic</strong>
                    <span>Add curriculum learning guide</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar">
            <div className="admin-toolbar-title-wrap">
              <h2 className="admin-section-heading">
                <Crown size={20} className="text-gold" />
                <span>Community Team & Leadership</span>
              </h2>
              <p className="admin-section-subtext">
                Assign community roles and positions for members displayed in the public community directory.
              </p>
            </div>
            <div className="admin-toolbar-actions">
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => openTeamModal(null)}
              >
                <Plus size={16} />
                <span>Assign Team Member</span>
              </button>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Hierarchy Tier</th>
                  <th>Position Title</th>
                  <th>Domain</th>
                  <th>Order</th>
                  <th className="admin-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingTeam && teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <RefreshCw className="admin-spin" size={20} />
                      <span>Loading team members...</span>
                    </td>
                  </tr>
                ) : teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <Users size={24} />
                      <span>No team members assigned yet. Click "Assign Team Member" above to add leaders and coordinators.</span>
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="admin-user-cell">
                          <AdminUserAvatar src={m.avatar} username={m.username} />
                          <div className="admin-user-meta">
                            <span className="admin-user-name">@{m.username}</span>
                            <span className="admin-email-text">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-tier-chip tier-${(m.communityRole?.category || "lead").toLowerCase().replace(/\s+/g, '-')}`}>
                          {m.communityRole?.category === "Head" ? "Club Head" : (m.communityRole?.category || "Member")}
                        </span>
                      </td>
                      <td>
                        <span className="admin-pos-title">
                          {m.communityRole?.positionTitle || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-domain-chip">
                          {m.communityRole?.teamDomain || "Core"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-order-chip">
                          #{m.communityRole?.order ?? 99}
                        </span>
                      </td>
                      <td className="admin-td-actions">
                        <div className="admin-actions-row">
                          <button
                            type="button"
                            className="admin-action-btn"
                            onClick={() => openTeamModal(m)}
                            title="Edit team position and title"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn danger"
                            onClick={() => setMemberToRemove(m)}
                            title="Remove from community team"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <Search className="admin-search-icon" size={16} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setUserSearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-group">
              <select
                className="admin-select"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Activity</th>
                  <th className="admin-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <RefreshCw className="admin-spin" size={20} />
                      <span>Loading community members...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <AlertCircle size={22} />
                      <span>No members match your criteria</span>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-user-cell">
                          <AdminUserAvatar src={u.avatar} username={u.username} />
                          <div className="admin-user-meta">
                            <span className="admin-user-name">@{u.username}</span>
                            {u.isProtected && (
                              <span className="admin-shield-badge">Primary Admin</span>
                            )}
                            {u.isBanned && (
                              <span className="admin-badge locked" style={{ marginLeft: "4px" }}>Banned</span>
                            )}
                            {u.moderationStrikes > 0 && (
                              <span className="admin-badge neutral" style={{ marginLeft: "4px" }}>{u.moderationStrikes} strikes</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-email-cell">
                          <span className="admin-email-text">{u.email}</span>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => copyToClipboard(u.email, u.id)}
                            title="Copy email address"
                          >
                            {copiedEmail === u.id ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${u.role}`}>
                          {u.role === "admin" ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td>
                        <span className="admin-date-text">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <div className="admin-activity-chips">
                          <span className="admin-count-chip" title="Discussions created">
                            {u.stats?.posts || 0} posts
                          </span>
                          <span className="admin-count-chip" title="Replies posted">
                            {u.stats?.comments || 0} comments
                          </span>
                        </div>
                      </td>
                      <td className="admin-td-actions">
                        <div className="admin-actions-row">
                          {!u.isProtected && u.id !== user.id && (
                            <>
                              {u.isBanned ? (
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  style={{ borderColor: "#10b981", color: "#10b981" }}
                                  onClick={() => setUnbanTarget(u)}
                                  title="Unban this user"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                                  onClick={() => {
                                    setBanUserModalTarget(u);
                                    setBanForm({ reason: "", hours: "" });
                                  }}
                                  title="Ban user"
                                >
                                  Ban
                                </button>
                              )}
                              <button
                                type="button"
                                className="admin-action-btn"
                                onClick={() => setRoleChangeTarget(u)}
                                title={u.role === "admin" ? "Demote to student" : "Promote to administrator"}
                              >
                                {u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn danger"
                                onClick={() => setUserToDelete(u)}
                                title="Permanently delete user account"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "moderation" && (
        <div className="admin-tab-content">
          {/* Subtabs Bar */}
          <div className="admin-subtabs-nav">
            <button
              type="button"
              className={`admin-subtab-btn ${modSubTab === "flagged" ? "active" : ""}`}
              onClick={() => setModSubTab("flagged")}
            >
              <ShieldAlert size={15} />
              <span>Flagged Queue</span>
              {flaggedItems.length > 0 && (
                <span className="subtab-count-pill danger">{flaggedItems.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${modSubTab === "reports" ? "active" : ""}`}
              onClick={() => setModSubTab("reports")}
            >
              <Flag size={15} />
              <span>User Reports</span>
              {reports.filter((r) => r.status === "pending").length > 0 && (
                <span className="subtab-count-pill warning">
                  {reports.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${modSubTab === "appeals" ? "active" : ""}`}
              onClick={() => setModSubTab("appeals")}
            >
              <FileText size={15} />
              <span>Appeals</span>
              {(stats.pendingAppealsCount || appeals.filter((a) => a.status === "pending").length) > 0 && (
                <span className="subtab-count-pill warning">
                  {stats.pendingAppealsCount || appeals.filter((a) => a.status === "pending").length}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${modSubTab === "banned" ? "active" : ""}`}
              onClick={() => setModSubTab("banned")}
            >
              <UserX size={15} />
              <span>Banned Users</span>
              {bannedUsersList.length > 0 && (
                <span className="subtab-count-pill neutral">{bannedUsersList.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${modSubTab === "logs" ? "active" : ""}`}
              onClick={() => setModSubTab("logs")}
            >
              <Activity size={15} />
              <span>Audit Log</span>
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${modSubTab === "discussions" ? "active" : ""}`}
              onClick={() => setModSubTab("discussions")}
            >
              <MessageSquare size={15} />
              <span>Discussions</span>
            </button>
          </div>

          {/* SUBTAB 1: FLAGGED QUEUE */}
          {modSubTab === "flagged" && (
            <>
              <div className="admin-toolbar">
                <p className="admin-toolbar-desc">
                  Content automatically flagged by automated moderation tools or community reports. These items are hidden from ordinary members until an administrator restores them.
                </p>
                <div className="admin-filter-group">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={loadFlaggedItems}
                    disabled={loadingFlagged}
                    title="Reload flagged queue"
                  >
                    <RefreshCw size={14} className={loadingFlagged ? "admin-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item & Content</th>
                      <th>Author</th>
                      <th>Violation Reason</th>
                      <th>Hidden Since</th>
                      <th className="admin-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingFlagged && flaggedItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="admin-table-empty">
                          <RefreshCw className="admin-spin" size={20} />
                          <span>Scanning flagged items...</span>
                        </td>
                      </tr>
                    ) : flaggedItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="admin-table-empty">
                          <ShieldCheck size={26} className="text-emerald" />
                          <span>No flagged content found! All clear.</span>
                        </td>
                      </tr>
                    ) : (
                      flaggedItems.map((item) => {
                        const postTargetId = item.itemType === "post" ? (item.id || item._id) : (item.postId || item.post);
                        return (
                          <tr key={`${item.itemType}-${item.id || item._id}`}>
                            <td className="admin-post-cell">
                              <div className="admin-post-title-wrap">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <span className={`admin-badge ${item.itemType === "post" ? "pinned" : "neutral"}`}>
                                    {item.itemType === "post" ? "Post" : "Comment"}
                                  </span>
                                  <span className="admin-badge locked" style={{ fontSize: "0.72rem", padding: "1px 6px" }}>
                                    Restricted
                                  </span>
                                  {postTargetId ? (
                                    <Link
                                      to={`/forum/posts/${postTargetId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="admin-post-title"
                                      style={{ fontSize: "0.95rem", color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                      title="View post on forum"
                                    >
                                      {item.title || (item.body ? (stripHtml(item.body).length > 50 ? stripHtml(item.body).substring(0, 50) + "..." : stripHtml(item.body)) : "[No content]")}
                                      <ExternalLink size={12} />
                                    </Link>
                                  ) : (
                                    <span className="admin-post-title" style={{ fontSize: "0.95rem" }}>
                                      {item.title || (item.body ? (stripHtml(item.body).length > 50 ? stripHtml(item.body).substring(0, 50) + "..." : stripHtml(item.body)) : "[No content]")}
                                    </span>
                                  )}
                                </div>
                                {item.postTitle && (
                                  <span className="admin-date-subtext">
                                    On discussion: {postTargetId ? (
                                      <Link to={`/forum/posts/${postTargetId}`} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>
                                        <em>{item.postTitle}</em>
                                      </Link>
                                    ) : (
                                      <em>{item.postTitle}</em>
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="admin-user-cell">
                                <AdminUserAvatar src={item.author?.avatar} username={item.author?.username} />
                                <div className="admin-user-info">
                                  <span className="admin-username">@{item.author?.username || "unknown"}</span>
                                  <span className="admin-date-subtext">
                                    Strikes: <strong>{item.author?.strikes || 0}</strong>
                                    {item.author?.isBanned ? " (Banned)" : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span className="admin-badge locked" style={{ alignSelf: "flex-start", textTransform: "uppercase" }}>
                                  {item.moderationCategory || "abuse"}
                                </span>
                                <span style={{ fontSize: "0.8rem", color: "#f87171", maxWidth: "260px", lineHeight: "1.3" }}>
                                  {item.moderationReason}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="admin-date-subtext">
                                {new Date(item.hiddenAt || item.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>
                            <td className="admin-td-actions">
                              <div className="admin-actions-row">
                                {postTargetId && (
                                  <Link
                                    to={`/forum/posts/${postTargetId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-icon-btn secondary"
                                    title="View post on forum"
                                  >
                                    <ExternalLink size={14} />
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  className="admin-icon-btn secondary"
                                  onClick={() => setViewItemModal(item)}
                                  title="Inspect flagged content details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-icon-btn active"
                                  onClick={() => setItemToRestore(item)}
                                  title="Restore item to public view (unhide)"
                                >
                                  <RotateCcw size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-icon-btn danger"
                                  onClick={() => setItemToDelete(item)}
                                  title="Delete item permanently"
                                >
                                  <Trash2 size={14} />
                                </button>
                                {item.author && !item.author.isBanned && item.author.role !== "admin" && (
                                  <button
                                    type="button"
                                    className="admin-icon-btn danger"
                                    onClick={() => setBanUserModalTarget(item.author)}
                                    title="Ban offending user"
                                  >
                                    <UserX size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SUBTAB 2: USER REPORTS */}
          {modSubTab === "reports" && (
            <>
              <div className="admin-toolbar">
                <p className="admin-toolbar-desc">
                  Reports submitted by community members for posts, comments, or private messages. Each report is automatically evaluated by AI against community safety guidelines.
                </p>
                <div className="admin-filter-group">
                  <select
                    className="admin-select"
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                  >
                    <option value="all">All Report Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="confirmed">Confirmed Violations</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={loadReports}
                    disabled={loadingReports}
                    title="Reload reports"
                  >
                    <RefreshCw size={14} className={loadingReports ? "admin-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Type & Content</th>
                      <th>Reporter</th>
                      <th>Reported User</th>
                      <th>AI Assessment</th>
                      <th>Status</th>
                      <th className="admin-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingReports && reports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <RefreshCw className="admin-spin" size={20} />
                          <span>Loading user reports...</span>
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <CheckCircle2 size={26} className="text-emerald" />
                          <span>No user reports matching this filter.</span>
                        </td>
                      </tr>
                    ) : (
                      reports.map((r) => {
                        const reportPostId = r.contentPreview?.postId || (r.contentType === "post" ? r.contentPreview?.id : null);
                        return (
                          <tr key={r.id}>
                            <td className="admin-post-cell">
                              <div className="admin-post-title-wrap">
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <span className="admin-badge neutral" style={{ textTransform: "uppercase" }}>
                                    {r.contentType}
                                  </span>
                                  {(() => {
                                    const previewText = r.contentPreview?.title || stripHtml(r.contentPreview?.bodySnippet || r.contentPreview?.body || r.contentPreview?.text) || "[Removed]";
                                    return reportPostId ? (
                                      <Link
                                        to={`/forum/posts/${reportPostId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="admin-post-title"
                                        style={{ fontSize: "0.88rem", color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: "4px", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                        title="View reported content on forum"
                                      >
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewText}</span>
                                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                                      </Link>
                                    ) : (
                                      <span className="admin-post-title" style={{ fontSize: "0.88rem", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                                        {previewText}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <span className="admin-date-subtext">
                                  Reason: <em>"{r.userReason}"</em>
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="admin-author-text">@{r.reporter?.username || "unknown"}</span>
                            </td>
                            <td>
                              <div className="admin-user-cell">
                                <div className="admin-user-info">
                                  <span className="admin-username">@{r.targetAuthor?.username || "unknown"}</span>
                                  <span className="admin-date-subtext">
                                    Strikes: {r.targetAuthor?.strikes || 0}
                                    {r.targetAuthor?.isBanned ? " (Banned)" : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span
                                  className="admin-badge"
                                  style={{
                                    background: r.aiVerdict === "VIOLATION" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                    color: r.aiVerdict === "VIOLATION" ? "#ef4444" : "#10b981",
                                    border: r.aiVerdict === "VIOLATION" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  {r.aiVerdict || "PENDING"} {r.aiCategory ? `(${r.aiCategory})` : ""}
                                </span>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8", maxWidth: "240px", lineHeight: "1.25" }}>
                                  {r.aiReason || "No AI feedback"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className="admin-badge"
                                style={{
                                  background:
                                    r.status === "pending"
                                      ? "rgba(245, 158, 11, 0.15)"
                                      : r.status === "confirmed"
                                      ? "rgba(239, 68, 68, 0.15)"
                                      : "rgba(100, 116, 139, 0.15)",
                                  color:
                                    r.status === "pending"
                                      ? "#fbbf24"
                                      : r.status === "confirmed"
                                      ? "#f87171"
                                      : "#94a3b8",
                                  textTransform: "capitalize",
                                }}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="admin-td-actions">
                              <div className="admin-actions-row">
                                {reportPostId && (
                                  <Link
                                    to={`/forum/posts/${reportPostId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-icon-btn secondary"
                                    title="View reported post in new tab"
                                  >
                                    <ExternalLink size={14} />
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  className="admin-icon-btn secondary"
                                  onClick={() =>
                                    setViewItemModal({
                                      contentType: r.contentType,
                                      body: r.contentPreview?.body || r.contentPreview?.text,
                                      title: r.contentPreview?.title,
                                      author: r.targetAuthor,
                                      postId: reportPostId,
                                      moderationCategory: r.aiCategory,
                                      moderationReason: `[Reported by @${r.reporter?.username}]: ${r.userReason} | [AI]: ${r.aiReason}`,
                                    })
                                  }
                                  title="Inspect content and details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-icon-btn active"
                                  onClick={() => {
                                    setOverrideForm({
                                      newStatus: r.status === "pending" ? (r.aiVerdict === "VIOLATION" ? "confirmed" : "dismissed") : r.status,
                                      action: "none",
                                      applyStrike: false,
                                      reason: "",
                                    });
                                    setOverrideReportTarget(r);
                                  }}
                                  title="Review and resolve report"
                                >
                                  <Edit3 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SUBTAB: APPEALS */}
          {modSubTab === "appeals" && (
            <>
              <div className="admin-toolbar">
                <p className="admin-toolbar-desc">
                  Member appeals against automated moderation flags and account strikes. Review appellant defenses and revoke strikes or restore content if justified.
                </p>
                <div className="admin-filter-group">
                  <select
                    className="admin-select"
                    value={appealStatusFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAppealStatusFilter(val);
                      loadAppeals(val);
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Appeals</option>
                    <option value="approved">Approved Appeals</option>
                    <option value="rejected">Rejected Appeals</option>
                  </select>
                  <select
                    className="admin-select"
                    value={appealCategoryFilter}
                    onChange={(e) => setAppealCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="account_ban">Account Bans</option>
                    <option value="content_strike">Strikes & Content</option>
                  </select>
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={() => loadAppeals()}
                    disabled={loadingAppeals}
                    title="Reload appeals"
                  >
                    <RefreshCw size={14} className={loadingAppeals ? "admin-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Appellant</th>
                      <th>Item / Category</th>
                      <th>Original Reason</th>
                      <th>User Statement</th>
                      <th>Status</th>
                      <th className="admin-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAppeals && appeals.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <RefreshCw className="admin-spin" size={20} />
                          <span>Loading appeals...</span>
                        </td>
                      </tr>
                    ) : appeals.filter((a) => {
                        if (appealCategoryFilter === "account_ban") {
                          return a.itemType === "account_ban" || a.originalCategory === "account_ban";
                        }
                        if (appealCategoryFilter === "content_strike") {
                          return a.itemType !== "account_ban" && a.originalCategory !== "account_ban";
                        }
                        return true;
                      }).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <CheckCircle2 size={26} className="text-emerald" />
                          <span>No moderation appeals matching this filter.</span>
                        </td>
                      </tr>
                    ) : (
                      appeals
                        .filter((a) => {
                          if (appealCategoryFilter === "account_ban") {
                            return a.itemType === "account_ban" || a.originalCategory === "account_ban";
                          }
                          if (appealCategoryFilter === "content_strike") {
                            return a.itemType !== "account_ban" && a.originalCategory !== "account_ban";
                          }
                          return true;
                        })
                        .map((a) => (
                        <tr key={a.id || a._id}>
                          <td>
                            <div className="admin-user-cell">
                              <AdminUserAvatar
                                src={a.appellant?.avatar}
                                name={a.appellant?.username || "User"}
                              />
                              <div className="admin-user-info">
                                <span className="admin-username">@{a.appellant?.username || "unknown"}</span>
                                <span className="admin-date-subtext">
                                  Strikes: {a.appellant?.moderationStrikes || 0}
                                  {a.appellant?.isBanned ? " (Banned)" : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                {a.itemType === "account_ban" || a.originalCategory === "account_ban" ? (
                                  <span
                                    className="admin-badge danger"
                                    style={{
                                      background: "rgba(239, 68, 68, 0.2)",
                                      color: "#f87171",
                                      border: "1px solid rgba(239, 68, 68, 0.4)",
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <ShieldAlert size={12} />
                                    <span>Account Ban</span>
                                  </span>
                                ) : (
                                  <>
                                    {a.itemType !== "strike" && (
                                      <span className="admin-badge neutral" style={{ textTransform: "uppercase" }}>
                                        {a.itemType}
                                      </span>
                                    )}
                                    {a.strikeIndex ? (
                                      <span className="admin-badge warning">
                                        Strike #{a.strikeIndex}
                                      </span>
                                    ) : a.itemType === "strike" ? (
                                      <span className="admin-badge warning">
                                        Strike
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                              {a.targetPost?.title && (
                                <Link
                                  to={`/forum/posts/${a.targetPost.id || a.targetPostId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-date-subtext"
                                  style={{
                                    maxWidth: "240px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    color: "#60a5fa",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title={a.targetPost.title}
                                >
                                  <span>"{a.targetPost.title}"</span>
                                  <ExternalLink size={10} style={{ flexShrink: 0 }} />
                                </Link>
                              )}
                              {a.targetComment && (
                                <Link
                                  to={(a.targetComment.postId || a.targetPostId) ? `/forum/posts/${a.targetComment.postId || a.targetPostId}` : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-date-subtext"
                                  style={{
                                    maxWidth: "240px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    color: (a.targetComment.postId || a.targetPostId) ? "#60a5fa" : "inherit",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title={stripHtml(a.targetComment.bodySnippet || a.targetComment.body || a.targetComment.postTitle || "Comment")}
                                >
                                  <span>"{stripHtml(a.targetComment.bodySnippet || a.targetComment.body || a.targetComment.postTitle || "Comment")}"</span>
                                  {(a.targetComment.postId || a.targetPostId) && <ExternalLink size={10} style={{ flexShrink: 0 }} />}
                                </Link>
                              )}
                            </div>
                          </td>
                          <td style={{ maxWidth: "220px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <span style={{ fontSize: "0.82rem", color: "#fca5a5", wordBreak: "break-word" }}>
                                {a.originalReason || "Policy violation"}
                              </span>
                              {a.originalCategory && (
                                <span className="admin-date-subtext" style={{ textTransform: "capitalize" }}>
                                  Category: {a.originalCategory === "account_ban" ? "Account Ban" : a.originalCategory}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ maxWidth: "280px", minWidth: "200px" }}>
                            <div
                              style={{
                                maxHeight: expandedTextMap[`appeal-${a.id || a._id}`] ? "none" : "86px",
                                overflow: expandedTextMap[`appeal-${a.id || a._id}`] ? "visible" : "hidden",
                                position: "relative",
                                transition: "max-height 0.2s ease",
                              }}
                            >
                              <p style={{ fontSize: "0.84rem", color: "#f8fafc", margin: 0, lineHeight: "1.4", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                "{a.statement}"
                              </p>
                              {!expandedTextMap[`appeal-${a.id || a._id}`] && a.statement && a.statement.length > 100 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: "30px",
                                    background: "linear-gradient(to bottom, rgba(11, 17, 32, 0), #0b1120)",
                                    pointerEvents: "none",
                                  }}
                                />
                              )}
                            </div>
                            {a.statement && a.statement.length > 100 && (
                              <button
                                type="button"
                                onClick={() => toggleTextExpanded(`appeal-${a.id || a._id}`)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#60a5fa",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  padding: "2px 0",
                                  marginTop: "2px",
                                  cursor: "pointer",
                                  display: "inline-block",
                                }}
                              >
                                {expandedTextMap[`appeal-${a.id || a._id}`] ? "Show less" : "Show full text"}
                              </button>
                            )}
                            <span className="admin-date-subtext" style={{ display: "block", marginTop: "4px" }}>
                              Submitted {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span
                              className="admin-badge"
                              style={{
                                background:
                                  a.status === "pending"
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : a.status === "approved"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(239, 68, 68, 0.15)",
                                color:
                                  a.status === "pending"
                                    ? "#fbbf24"
                                    : a.status === "approved"
                                    ? "#34d399"
                                    : "#f87171",
                                textTransform: "capitalize",
                              }}
                            >
                              {a.status === "pending" ? "Pending Review" : a.status}
                            </span>
                            {a.adminNotes && (
                              <span className="admin-date-subtext" style={{ display: "block", marginTop: "3px" }}>
                                Note: {a.adminNotes}
                              </span>
                            )}
                          </td>
                          <td className="admin-td-actions">
                            <div className="admin-actions-row" style={{ justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                type="button"
                                className="admin-icon-btn secondary"
                                onClick={() =>
                                  setViewItemModal({
                                    contentType: a.itemType,
                                    body: a.targetComment?.body || a.targetComment?.bodySnippet || a.targetPost?.body || a.targetPost?.bodySnippet || a.statement,
                                    title: a.targetPost?.title || (a.targetComment ? `Comment on: "${a.targetComment.postTitle || 'Post'}"` : "Appealed Content"),
                                    author: a.appellant,
                                    postId: a.targetPostId || a.targetPost?.id || a.targetComment?.postId,
                                    moderationCategory: a.originalCategory,
                                    originalReason: a.originalReason,
                                    appealStatement: a.statement,
                                    moderationReason: `[Original Reason]: ${a.originalReason} | [Appeal Statement]: "${a.statement}"`,
                                  })
                                }
                                title="Inspect appealed content"
                              >
                                <Eye size={13} />
                              </button>
                              {(a.targetPostId || a.targetPost?.id || a.targetComment?.postId) && (
                                <Link
                                  to={`/forum/posts/${a.targetPostId || a.targetPost?.id || a.targetComment?.postId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-icon-btn secondary"
                                  title="View post on forum"
                                >
                                  <ExternalLink size={13} />
                                </Link>
                              )}
                              {a.status === "pending" && (
                                <button
                                  type="button"
                                  className="admin-action-btn primary"
                                  onClick={() => {
                                    setAppealToResolve(a);
                                    setAppealResolveForm({
                                      status: "approved",
                                      adminNotes: "",
                                      restoreContent: true,
                                      decrementStrike: true,
                                    });
                                  }}
                                  title="Review & resolve appeal"
                                  style={{ gap: "4px", padding: "5px 10px", fontSize: "0.78rem" }}
                                >
                                  <Edit3 size={13} />
                                  <span>Resolve</span>
                                </button>
                              )}
                            </div>
                            {a.status !== "pending" && a.resolvedBy && (
                              <span
                                className="admin-date-subtext"
                                style={{ display: "block", marginTop: "4px", textAlign: "right", whiteSpace: "nowrap" }}
                              >
                                Resolved by @{a.resolvedBy}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SUBTAB 3: BANNED USERS */}
          {modSubTab === "banned" && (
            <>
              <div className="admin-toolbar">
                <p className="admin-toolbar-desc">
                  Users currently suspended from posting, replying to forum discussions, and sending direct messages.
                </p>
                <div className="admin-filter-group">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={loadBannedUsers}
                    disabled={loadingBanned}
                    title="Reload banned users"
                  >
                    <RefreshCw size={14} className={loadingBanned ? "admin-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Ban Reason</th>
                      <th>Strikes</th>
                      <th>Suspension Duration</th>
                      <th>Suspended At</th>
                      <th className="admin-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingBanned && bannedUsersList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <RefreshCw className="admin-spin" size={20} />
                          <span>Loading banned users...</span>
                        </td>
                      </tr>
                    ) : bannedUsersList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <ShieldCheck size={26} className="text-emerald" />
                          <span>No banned users on record.</span>
                        </td>
                      </tr>
                    ) : (
                      bannedUsersList.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="admin-user-cell">
                              <AdminUserAvatar src={u.avatar} username={u.username} />
                              <div className="admin-user-info">
                                <span className="admin-username">@{u.username}</span>
                                <span className="admin-email">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.85rem", color: "#f87171" }}>
                              {u.banReason || "No reason specified"}
                            </span>
                          </td>
                          <td>
                            <span className="admin-category-pill">
                              {u.moderationStrikes} strike{u.moderationStrikes !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>
                            {u.isPermanent ? (
                              <span className="admin-badge locked">Permanent Ban</span>
                            ) : (
                              <span className="admin-badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                                Exp: {new Date(u.banExpiresAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="admin-date-subtext">
                              {new Date(u.bannedAt || u.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="admin-td-actions">
                            <button
                              type="button"
                              className="admin-action-btn primary"
                              onClick={() => {
                                setUnbanResetStrikes(true);
                                setUnbanTarget(u);
                              }}
                              title="Reinstate user"
                            >
                              <UserCheck size={13} />
                              <span>Reinstate</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SUBTAB 4: MODERATION AUDIT LOGS */}
          {modSubTab === "logs" && (
            <>
              <div className="admin-toolbar">
                <p className="admin-toolbar-desc">
                  Immutable audit trail tracking all automated moderation actions and administrator interventions.
                </p>
                <div className="admin-filter-group">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={loadModLogs}
                    disabled={loadingModLogs}
                    title="Reload audit logs"
                  >
                    <RefreshCw size={14} className={loadingModLogs ? "admin-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action Event</th>
                      <th>Performed By</th>
                      <th>Target</th>
                      <th>Reason & Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingModLogs && modLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="admin-table-empty">
                          <RefreshCw className="admin-spin" size={20} />
                          <span>Loading audit log entries...</span>
                        </td>
                      </tr>
                    ) : modLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="admin-table-empty">
                          <Activity size={26} className="text-muted" />
                          <span>No moderation audit records yet.</span>
                        </td>
                      </tr>
                    ) : (
                      modLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <span className="admin-date-subtext">
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td>
                            <span
                              className="admin-badge"
                              style={{
                                background: log.action.includes("ban")
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : log.action.includes("unban") || log.action.includes("restore")
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : "rgba(59, 130, 246, 0.15)",
                                color: log.action.includes("ban")
                                  ? "#ef4444"
                                  : log.action.includes("unban") || log.action.includes("restore")
                                  ? "#10b981"
                                  : "#60a5fa",
                              }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="admin-author-text">
                              {log.performedBy?.username ? `@${log.performedBy.username}` : "System (AI)"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-user-info">
                              {log.targetUser && (
                                <span className="admin-username">@{log.targetUser.username}</span>
                              )}
                              {log.targetPostTitle && (
                                <span className="admin-date-subtext">
                                  Topic: {log.targetPostTitle}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ maxWidth: "340px", minWidth: "220px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              {log.reason && (
                                <span style={{ fontSize: "0.83rem", color: "#f1f5f9", wordBreak: "break-word" }}>
                                  {log.reason}
                                </span>
                              )}
                              {log.details && (
                                <div>
                                  <div
                                    style={{
                                      maxHeight: expandedTextMap[`log-${log.id}`] ? "none" : "60px",
                                      overflow: expandedTextMap[`log-${log.id}`] ? "visible" : "hidden",
                                      position: "relative",
                                    }}
                                  >
                                    <span className="admin-date-subtext" style={{ wordBreak: "break-word", lineHeight: "1.35", display: "block" }}>
                                      {log.details}
                                    </span>
                                    {!expandedTextMap[`log-${log.id}`] && log.details.length > 90 && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          height: "22px",
                                          background: "linear-gradient(to bottom, rgba(11, 17, 32, 0), #0b1120)",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    )}
                                  </div>
                                  {log.details.length > 90 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleTextExpanded(`log-${log.id}`)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#60a5fa",
                                        fontSize: "0.74rem",
                                        fontWeight: 600,
                                        padding: "1px 0",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {expandedTextMap[`log-${log.id}`] ? "Show less" : "Show full text"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SUBTAB 5: FORUM DISCUSSIONS */}
          {modSubTab === "discussions" && (
            <>
              <div className="admin-toolbar">
                <div className="admin-search-wrap">
                  <Search className="admin-search-icon" size={16} />
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search discussions by title or content..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                  />
                  {postSearch && (
                    <button
                      type="button"
                      className="admin-search-clear"
                      onClick={() => setPostSearch("")}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="admin-filter-group">
                  <select
                    className="admin-select"
                    value={postCategoryFilter}
                    onChange={(e) => setPostCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="projects">Projects</option>
                    <option value="help">Help & Questions</option>
                    <option value="events">Events</option>
                    <option value="announcements">Announcements</option>
                  </select>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Discussion</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Feedback</th>
                      <th>Moderation Status</th>
                      <th className="admin-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPosts && posts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <RefreshCw className="admin-spin" size={20} />
                          <span>Loading discussion topics...</span>
                        </td>
                      </tr>
                    ) : filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-table-empty">
                          <AlertCircle size={22} />
                          <span>No discussions found</span>
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((p) => (
                        <tr key={p.id}>
                          <td className="admin-post-cell">
                            <div className="admin-post-title-wrap">
                              <Link to={`/forum/posts/${p.id}`} className="admin-post-title" target="_blank" rel="noopener noreferrer">
                                {p.title}
                              </Link>
                              <span className="admin-date-subtext">
                                {new Date(p.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-author-text">
                              @{p.author?.username || "unknown"}
                            </span>
                          </td>
                          <td>
                            <span className="admin-category-pill">#{p.category || "general"}</span>
                          </td>
                          <td>
                            <div className="admin-stats-row">
                              <span className="admin-count-chip" title="Vote score">
                                <ArrowUp size={12} className="text-emerald" />
                                <span>{p.voteScore}</span>
                              </span>
                              <span className="admin-count-chip" title="Comments count">
                                <MessageSquare size={12} className="text-blue" />
                                <span>{p.commentCount}</span>
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-status-badges">
                              {p.isPinned && (
                                <span className="admin-badge pinned">
                                  <Pin size={11} />
                                  <span>Pinned</span>
                                </span>
                              )}
                              {p.isLocked && (
                                <span className="admin-badge locked">
                                  <Lock size={11} />
                                  <span>Locked</span>
                                </span>
                              )}
                              {!p.isPinned && !p.isLocked && (
                                <span className="admin-badge neutral">Active</span>
                              )}
                            </div>
                          </td>
                          <td className="admin-td-actions">
                            <div className="admin-actions-row">
                              <button
                                type="button"
                                className="admin-icon-btn secondary"
                                onClick={() => setPreviewingPost(p)}
                                title="Preview discussion body"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className={`admin-icon-btn ${p.isPinned ? "active" : ""}`}
                                onClick={() => handleTogglePin(p)}
                                title={p.isPinned ? "Unpin discussion" : "Pin discussion to top"}
                              >
                                {p.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                              </button>
                              <button
                                type="button"
                                className={`admin-icon-btn ${p.isLocked ? "active" : ""}`}
                                onClick={() => handleToggleLock(p)}
                                title={p.isLocked ? "Unlock replies" : "Lock replies"}
                              >
                                {p.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn danger"
                                onClick={() => setPostToDelete(p)}
                                title="Delete discussion and comments"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar">
            <p className="admin-toolbar-desc">
              Curate and publish curriculum guides that sync live to the public{" "}
              <Link to="/resources" className="admin-link">
                /resources
              </Link>{" "}
              learning page.
            </p>

            <button
              type="button"
              className="admin-primary-btn"
              onClick={() => {
                setEditingResource(null);
                setResourceForm({
                  title: "",
                  description: "",
                  category: "getting-started",
                  items: "",
                });
                setResourceModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Resource Topic</span>
            </button>
          </div>

          <div className="admin-resources-grid">
            {resources.length === 0 ? (
              <div className="admin-empty-card">
                <BookOpen size={36} />
                <h3>No Custom Resources Found</h3>
                <p>
                  The platform is currently rendering the default curriculum tracks. Click above to add your first database resource.
                </p>
              </div>
            ) : (
              resources.map((r) => (
                <article className="admin-resource-card" key={r.id}>
                  <div className="admin-resource-top">
                    <span className="admin-category-pill">#{r.category}</span>
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => {
                          setEditingResource(r);
                          setResourceForm({
                            title: r.title,
                            description: r.description,
                            category: r.category,
                            items: (r.items || []).join("\n"),
                          });
                          setResourceModalOpen(true);
                        }}
                        title="Edit resource"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        onClick={() => setResourceToDelete(r)}
                        title="Delete resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="admin-resource-heading">{r.title}</h3>
                  <p className="admin-resource-summary">{r.description}</p>

                  {r.items && r.items.length > 0 && (
                    <div className="admin-resource-chips">
                      {r.items.map((item, idx) => (
                        <span className="admin-item-tag" key={idx}>
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="admin-tab-content">
          <div className="admin-system-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Server size={18} />
                  <span>Platform & Infrastructure Health</span>
                </h3>
              </div>
              <div className="admin-system-info-list">
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">API Gateway Status</span>
                  <span className="admin-sys-badge healthy">
                    <CheckCircle2 size={12} />
                    <span>Online</span>
                  </span>
                </div>
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">Primary Database</span>
                  <span className="admin-sys-badge healthy">
                    <CheckCircle2 size={12} />
                    <span>Connected (MongoDB)</span>
                  </span>
                </div>
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">Node Runtime</span>
                  <span className="admin-sys-val">ES Modules / Express 4</span>
                </div>
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">Client Build</span>
                  <span className="admin-sys-val">React 19 / Vite</span>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <ShieldCheck size={18} />
                  <span>Protected Super Administrators</span>
                </h3>
              </div>
              <p className="admin-card-desc">
                The following administrator accounts are protected by the backend authorization layer against accidental deletion or role demotion:
              </p>
              <div className="admin-protected-list">
                <div className="admin-protected-item">
                  <span className="admin-email-tag">glug.jec@gmail.com</span>
                  <span className="admin-shield-badge">Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {resourceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setResourceModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingResource ? "Edit Resource Topic" : "Publish Resource Topic"}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResourceModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Topic Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  required
                  placeholder="e.g. Linux Kernel Architecture"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Category</label>
                <select
                  className="admin-select"
                  value={resourceForm.category}
                  onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                >
                  <option value="getting-started">Getting Started</option>
                  <option value="command-line">Command Line</option>
                  <option value="sysadmin">System Administration</option>
                  <option value="advanced">Advanced Topics</option>
                  <option value="tools">Tools & Environment</option>
                  <option value="tutorials">Tutorials & Guides</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  className="admin-form-textarea"
                  required
                  rows={3}
                  placeholder="Summary of what members will learn in this topic..."
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Curriculum Sub-topics (one item per line)</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  placeholder="Virtual File System&#10;Process Scheduling&#10;Memory Pages"
                  value={resourceForm.items}
                  onChange={(e) => setResourceForm({ ...resourceForm, items: e.target.value })}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setResourceModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  {editingResource ? "Save Changes" : "Publish Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewingPost && (
        <div className="admin-modal-overlay" onClick={() => setPreviewingPost(null)}>
          <div className="admin-modal-box preview" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-preview-title-wrap">
                <span className="admin-category-pill">#{previewingPost.category}</span>
                <h2 className="admin-modal-title">{previewingPost.title}</h2>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setPreviewingPost(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-preview-meta">
              <span>Author: <strong>@{previewingPost.author?.username || "unknown"}</strong></span>
              <span>•</span>
              <span>Score: <strong>{previewingPost.voteScore}</strong></span>
              <span>•</span>
              <span>Comments: <strong>{previewingPost.commentCount}</strong></span>
              <span>•</span>
              <span>{new Date(previewingPost.createdAt).toLocaleString()}</span>
            </div>

            <div className="admin-preview-body">
              {previewingPost.body ? (
                <MarkdownRenderer content={previewingPost.body} />
              ) : (
                <p className="text-muted">No content in discussion body.</p>
              )}
            </div>

            <div className="admin-modal-actions">
              <Link
                to={`/forum/posts/${previewingPost.id}`}
                className="admin-secondary-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />
                <span>Open in Forum</span>
              </Link>
              <button
                type="button"
                className="admin-cancel-btn"
                onClick={() => setPreviewingPost(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {roleChangeTarget && (
        <div className="admin-modal-overlay" onClick={() => !isUpdatingRole && setRoleChangeTarget(null)}>
          <div className="admin-modal-box alert" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-icon-alert">
              <AlertCircle size={32} />
            </div>
            <h2 className="admin-modal-title">Confirm Role Change</h2>
            <p className="admin-modal-desc">
              Are you sure you want to change the role of <strong>@{roleChangeTarget.username}</strong> to{" "}
              <strong>{roleChangeTarget.role === "admin" ? "Student" : "Administrator"}</strong>?
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-btn"
                disabled={isUpdatingRole}
                onClick={() => setRoleChangeTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                disabled={isUpdatingRole}
                onClick={confirmRoleChange}
              >
                {isUpdatingRole ? "Updating..." : "Confirm Role Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(userToDelete)}
        onClose={() => {
          if (!isDeletingUser) setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete Member Account"
        description="Are you sure you want to permanently delete this member?"
        itemTitle={userToDelete ? `@${userToDelete.username} (${userToDelete.email})` : ""}
        warningNote="All posts, replies, and votes authored by this user will be permanently deleted from the database."
        confirmText="Delete Account"
        isDeleting={isDeletingUser}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(resourceToDelete)}
        onClose={() => {
          if (!isDeletingResource) setResourceToDelete(null);
        }}
        onConfirm={confirmDeleteResource}
        title="Delete Resource Topic"
        description="Are you sure you want to delete this curriculum topic?"
        itemTitle={resourceToDelete?.title}
        warningNote="This topic will be removed from the public resources directory immediately."
        confirmText="Delete Topic"
        isDeleting={isDeletingResource}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(postToDelete)}
        onClose={() => {
          if (!isDeletingAdminPost) setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        title="Delete Forum Discussion"
        description="Are you sure you want to delete this discussion?"
        itemTitle={postToDelete?.title}
        warningNote="All comments, replies, upvotes, and bookmarks associated with this discussion will be permanently removed."
        confirmText="Delete Discussion"
        isDeleting={isDeletingAdminPost}
      />

      {teamModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setTeamModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <Crown size={20} className="text-gold" />
                <span>{editingTeamMember ? `Edit Position: @${editingTeamMember.username}` : "Assign Community Team Member"}</span>
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setTeamModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTeamPosition} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Select Existing User</label>
                {editingTeamMember ? (
                  <input
                    type="text"
                    className="admin-form-input"
                    value={`@${editingTeamMember.username} (${editingTeamMember.email})`}
                    disabled
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Search existing users by username or email..."
                      value={memberPickerSearch}
                      onChange={(e) => setMemberPickerSearch(e.target.value)}
                      style={{ marginBottom: "8px" }}
                    />
                    <select
                      className="admin-form-input"
                      value={teamForm.userId}
                      onChange={(e) => setTeamForm({ ...teamForm, userId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Existing User ({selectableUsers.length} available) --</option>
                      {selectableUsers.map((u) => {
                        const isAlreadyTeam = teamMembers.some((tm) => tm.id === u.id);
                        return (
                          <option key={u.id} value={u.id}>
                            @{u.username} ({u.email}) [{u.role.toUpperCase()}]{isAlreadyTeam ? " - (Already in Team)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </>
                )}
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Hierarchy Tier</label>
                  <select
                    className="admin-form-input"
                    value={teamForm.category}
                    onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value })}
                  >
                    <option value="Mentor">Mentor</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Head">Club Head</option>
                    <option value="Advisor">Advisor</option>
                    <option value="Co-Head">Co-Head</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Coordinator">Coordinator</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Team Domain</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Technical, Executive, Design"
                    value={teamForm.teamDomain}
                    onChange={(e) => setTeamForm({ ...teamForm, teamDomain: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Position Title</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Club President, Tech Lead"
                    value={teamForm.positionTitle}
                    onChange={(e) => setTeamForm({ ...teamForm, positionTitle: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Display Order (#)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={teamForm.order}
                    onChange={(e) => setTeamForm({ ...teamForm, order: e.target.value })}
                    min={1}
                    max={999}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setTeamModalOpen(false)}
                  disabled={isSavingTeam}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-btn"
                  disabled={isSavingTeam}
                >
                  {isSavingTeam ? "Saving..." : "Save Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => {
          if (!isRemovingMember) setMemberToRemove(null);
        }}
        onConfirm={handleRemoveTeamMember}
        title="Remove Member from Community Team"
        description="Are you sure you want to remove this member from the community leadership directory?"
        itemTitle={memberToRemove ? `@${memberToRemove.username}` : ""}
        warningNote="This will clear their community leadership role and remove them from the public community team page."
        confirmText="Remove Member"
        isDeleting={isRemovingMember}
      />

      {/* MODERATION MODAL 1: BAN USER */}
      {banUserModalTarget && (
        <div className="admin-modal-overlay" onClick={() => !isBanning && setBanUserModalTarget(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <UserX size={20} className="text-red" />
                <span>Suspend Member Account</span>
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setBanUserModalTarget(null)}
                disabled={isBanning}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-user-summary-box" style={{ margin: "4px 0 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <AdminUserAvatar src={banUserModalTarget.avatar} username={banUserModalTarget.username} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem" }}>
                      @{banUserModalTarget.username}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                      {banUserModalTarget.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span className="admin-badge neutral" style={{ fontSize: "0.74rem" }}>
                    Strikes: {banUserModalTarget.strikes || banUserModalTarget.moderationStrikes || 0}
                  </span>
                  <span className="admin-badge locked" style={{ fontSize: "0.74rem" }}>
                    {banUserModalTarget.role || "student"}
                  </span>
                </div>
              </div>
            </div>

            <p className="admin-modal-desc">
              Suspension immediately blocks this account from active sessions, posting, replying, and chatting.
            </p>

            <form onSubmit={handleConfirmBanUser} className="admin-modal-form" style={{ marginTop: "10px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Ban Reason *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Repeated violation of community guidelines (NSFW / abuse)"
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  required
                />
                <div className="admin-quick-reasons">
                  {[
                    "Harassment & Hate Speech",
                    "Spam / Commercial Ads",
                    "NSFW or Inappropriate Content",
                    "Repeated Rule Violations",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="admin-reason-chip"
                      onClick={() => setBanForm({ ...banForm, reason: preset })}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-form-group" style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>Suspension Duration</label>
                  <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                    {banForm.hours ? `${banForm.hours} hours` : "Permanent"}
                  </span>
                </div>

                <div className="admin-duration-grid">
                  {[
                    { label: "24 Hours", value: "24", sub: "1 Day" },
                    { label: "72 Hours", value: "72", sub: "3 Days" },
                    { label: "1 Week", value: "168", sub: "7 Days" },
                    { label: "Permanent", value: "", sub: "Indefinite" },
                  ].map((opt) => {
                    const isSelected = String(banForm.hours || "") === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        className={`admin-duration-pill ${isSelected ? "is-active" : ""}`}
                        onClick={() => setBanForm({ ...banForm, hours: opt.value })}
                      >
                        <span>{opt.label}</span>
                        <span style={{ fontSize: "0.7rem", opacity: 0.75, fontWeight: 400 }}>{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="number"
                    className="admin-form-input"
                    placeholder="Custom hours (e.g. 12, 48)..."
                    value={banForm.hours}
                    onChange={(e) => setBanForm({ ...banForm, hours: e.target.value })}
                    min={1}
                    style={{ padding: "7px 12px", fontSize: "0.82rem" }}
                  />
                </div>
                <span className="admin-field-hint" style={{ marginTop: "4px" }}>
                  Select a duration option above or type custom hours. Leave blank for permanent suspension.
                </span>
              </div>

              <div className="admin-modal-actions" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  className="admin-cancel-btn"
                  disabled={isBanning}
                  onClick={() => setBanUserModalTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-btn"
                  style={{ background: "#ef4444", borderColor: "#ef4444" }}
                  disabled={isBanning}
                >
                  <UserX size={15} />
                  <span>{isBanning ? "Suspending..." : "Confirm Suspension"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODERATION MODAL 2: UNBAN USER */}
      {unbanTarget && (
        <div className="admin-modal-overlay" onClick={() => !isUnbanning && setUnbanTarget(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <UserCheck size={20} className="text-emerald" />
                <span>Reinstate Member: @{unbanTarget.username}</span>
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setUnbanTarget(null)}
                disabled={isUnbanning}
              >
                <X size={18} />
              </button>
            </div>
            <p className="admin-modal-desc" style={{ marginTop: "4px" }}>
              Are you sure you want to lift the suspension for <strong>@{unbanTarget.username}</strong>? Their posting and chatting privileges will be restored immediately.
            </p>
            <div className={`admin-checkbox-card ${unbanResetStrikes ? "is-checked" : ""}`} style={{ margin: "14px 0" }}>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  className="admin-native-checkbox"
                  checked={unbanResetStrikes}
                  onChange={(e) => setUnbanResetStrikes(e.target.checked)}
                />
                <span className="admin-custom-checkbox">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="admin-checkbox-text">Reset moderation strikes to 0 (Fresh start)</span>
              </label>
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-btn"
                disabled={isUnbanning}
                onClick={() => setUnbanTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                disabled={isUnbanning}
                onClick={handleConfirmUnban}
              >
                {isUnbanning ? "Reinstating..." : "Confirm Reinstatement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION MODAL 3: OVERRIDE REPORT */}
      {overrideReportTarget && (
        <div className="admin-modal-overlay" onClick={() => !isOverriding && setOverrideReportTarget(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <ShieldCheck size={20} className="text-blue" />
                <span>Review User Report</span>
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setOverrideReportTarget(null)}
                disabled={isOverriding}
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-user-summary-box" style={{ margin: "12px 0 16px" }}>
              <div className="admin-user-summary-top">
                <span className="admin-badge neutral" style={{ textTransform: "uppercase" }}>
                  {overrideReportTarget.contentType}
                </span>
                <span className="admin-date-subtext">
                  Reported by @{overrideReportTarget.reporter?.username || "unknown"}
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#f8fafc" }}>
                <strong>Report Reason:</strong> {overrideReportTarget.userReason || "No explanation provided"}
              </p>
              {overrideReportTarget.aiVerdict && (
                <p style={{ margin: 0, fontSize: "0.82rem", color: overrideReportTarget.aiVerdict === "VIOLATION" ? "#ef4444" : "#10b981" }}>
                  <strong>AI Assessment:</strong> {overrideReportTarget.aiVerdict} {overrideReportTarget.aiCategory ? `(${overrideReportTarget.aiCategory})` : ""} {overrideReportTarget.aiReason ? `— ${overrideReportTarget.aiReason}` : ""}
                </p>
              )}
            </div>
            <form onSubmit={handleConfirmOverride} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Set Report Resolution *</label>
                <select
                  className="admin-form-input"
                  value={overrideForm.newStatus}
                  onChange={(e) => setOverrideForm({ ...overrideForm, newStatus: e.target.value })}
                  required
                >
                  <option value="dismissed">Dismissed (Safe / False alarm)</option>
                  <option value="confirmed">Confirmed (Violation verified)</option>
                </select>
              </div>
              {overrideReportTarget.contentType !== "message" && (
                <div className="admin-form-group">
                  <label>Content Visibility Action</label>
                  <select
                    className="admin-form-input"
                    value={overrideForm.action}
                    onChange={(e) => setOverrideForm({ ...overrideForm, action: e.target.value })}
                  >
                    <option value="none">Keep current visibility</option>
                    <option value="hide">Hide content from public</option>
                    <option value="unhide">Unhide / restore content to public</option>
                  </select>
                </div>
              )}
              <div className={`admin-checkbox-card ${overrideForm.applyStrike ? "is-checked" : ""}`} style={{ margin: "4px 0" }}>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    className="admin-native-checkbox"
                    checked={overrideForm.applyStrike}
                    onChange={(e) => setOverrideForm({ ...overrideForm, applyStrike: e.target.checked })}
                  />
                  <span className="admin-custom-checkbox">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className="admin-checkbox-text">Apply strike penalty to author (enforces strike pipeline)</span>
                </label>
              </div>
              <div className="admin-form-group">
                <label>Moderation Note / Override Reason</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Optional audit log note..."
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                />
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  disabled={isOverriding}
                  onClick={() => setOverrideReportTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-btn"
                  disabled={isOverriding}
                >
                  {isOverriding ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODERATION MODAL: RESOLVE APPEAL */}
      {appealToResolve && (() => {
        const isAccountBanAppeal = appealToResolve.itemType === "account_ban" || appealToResolve.originalCategory === "account_ban";
        return (
          <div className="admin-modal-overlay" onClick={() => setAppealToResolve(null)}>
            <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">
                  {isAccountBanAppeal ? (
                    <ShieldAlert size={20} className="text-red" />
                  ) : (
                    <FileText size={20} className="text-yellow" />
                  )}
                  <span>{isAccountBanAppeal ? "Resolve Account Ban Appeal" : "Resolve Strike Appeal"}</span>
                </h2>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setAppealToResolve(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleResolveAppealSubmit}>
                <div className="admin-user-summary-box" style={{ marginBottom: "14px" }}>
                  <div className="admin-user-summary-top">
                    <span className="admin-username" style={{ fontSize: "0.95rem" }}>
                      @{appealToResolve.appellant?.username || "unknown"}
                    </span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {isAccountBanAppeal && (
                        <span
                          className="admin-badge danger"
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            fontWeight: 700,
                          }}
                        >
                          Account Ban
                        </span>
                      )}
                      <span className="admin-badge warning">
                        {appealToResolve.appellant?.moderationStrikes || 0} Strikes
                      </span>
                      {appealToResolve.appellant?.isBanned && (
                        <span className="admin-badge danger">Suspended</span>
                      )}
                    </div>
                  </div>
                  {appealToResolve.statement && (
                    <p className="admin-user-summary-quote">
                      "{appealToResolve.statement}"
                    </p>
                  )}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Decision *</label>
                  <div className="admin-decision-toggles">
                    <button
                      type="button"
                      className={`admin-decision-btn ${appealResolveForm.status === "approved" ? "approve-active" : ""}`}
                      onClick={() => setAppealResolveForm({ ...appealResolveForm, status: "approved" })}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isAccountBanAppeal ? "Approve & Unban" : "Approve Appeal"}</span>
                    </button>
                    <button
                      type="button"
                      className={`admin-decision-btn ${appealResolveForm.status === "rejected" ? "deny-active" : ""}`}
                      onClick={() => setAppealResolveForm({ ...appealResolveForm, status: "rejected" })}
                    >
                      <XCircle size={16} />
                      <span>Deny Appeal</span>
                    </button>
                  </div>
                </div>

                {appealResolveForm.status === "approved" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "14px 0" }}>
                    <div className={`admin-checkbox-card success ${appealResolveForm.decrementStrike ? "is-checked" : ""}`}>
                      <label className="admin-checkbox-label">
                        <input
                          type="checkbox"
                          className="admin-native-checkbox"
                          checked={appealResolveForm.decrementStrike}
                          onChange={(e) => setAppealResolveForm({ ...appealResolveForm, decrementStrike: e.target.checked })}
                        />
                        <span className="admin-custom-checkbox">
                          <Check size={13} strokeWidth={3} />
                        </span>
                        <span className="admin-checkbox-text">
                          {isAccountBanAppeal
                            ? "Lift account suspension and restore access"
                            : "Revoke / decrement 1 moderation strike"}
                        </span>
                      </label>
                    </div>
                    {!isAccountBanAppeal && (
                      <div className={`admin-checkbox-card success ${appealResolveForm.restoreContent ? "is-checked" : ""}`}>
                        <label className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            className="admin-native-checkbox"
                            checked={appealResolveForm.restoreContent}
                            onChange={(e) => setAppealResolveForm({ ...appealResolveForm, restoreContent: e.target.checked })}
                          />
                          <span className="admin-custom-checkbox">
                            <Check size={13} strokeWidth={3} />
                          </span>
                          <span className="admin-checkbox-text">Restore flagged content to public view (unhide)</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="admin-form-group" style={{ marginTop: "12px" }}>
                  <label className="admin-form-label">Administrator Response Note</label>
                  <textarea
                    className="admin-form-textarea"
                    rows={3}
                    placeholder={appealResolveForm.status === "approved" ? "Optional message to user..." : "Reason for denying appeal (sent to user)..."}
                    value={appealResolveForm.adminNotes}
                    onChange={(e) => setAppealResolveForm({ ...appealResolveForm, adminNotes: e.target.value })}
                  />
                </div>

                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    disabled={isResolvingAppeal}
                    onClick={() => setAppealToResolve(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={isResolvingAppeal}
                    style={{
                      background: appealResolveForm.status === "approved" ? "#10b981" : "#ef4444",
                      borderColor: appealResolveForm.status === "approved" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {isResolvingAppeal
                      ? "Saving..."
                      : appealResolveForm.status === "approved"
                      ? (isAccountBanAppeal ? "Approve & Unban User" : "Approve & Revoke Strike")
                      : "Deny Appeal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODERATION MODAL 4: VIEW FLAGGED CONTENT */}
      {viewItemModal && (
        <div className="admin-modal-overlay" onClick={() => setViewItemModal(null)}>
          <div className="admin-modal-box preview" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <ShieldAlert size={20} className="text-red" />
                <span>Flagged Content Details</span>
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setViewItemModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-preview-header" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span className="admin-badge neutral" style={{ textTransform: "uppercase" }}>
                  {viewItemModal.itemType || viewItemModal.contentType || "Item"}
                </span>
                {viewItemModal.author?.username && (
                  <span className="admin-date-subtext">
                    Author: @{viewItemModal.author.username} ({viewItemModal.author.strikes || 0} strikes)
                  </span>
                )}
              </div>
              {(() => {
                let origReason = viewItemModal.originalReason;
                let appealStmt = viewItemModal.appealStatement;

                if (!origReason && viewItemModal.moderationReason?.includes("[Original Reason]:")) {
                  const parts = viewItemModal.moderationReason.split("|");
                  const rPart = parts.find((p) => p.includes("[Original Reason]:"));
                  const sPart = parts.find((p) => p.includes("[Appeal Statement]:"));
                  if (rPart) origReason = rPart.replace("[Original Reason]:", "").trim();
                  if (sPart) appealStmt = sPart.replace("[Appeal Statement]:", "").trim().replace(/^"(.*)"$/, "$1");
                }

                if (origReason || appealStmt) {
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                      {origReason && (
                        <div style={{ background: "rgba(239, 68, 68, 0.09)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "10px 14px", borderRadius: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                            <span className="admin-badge danger" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                              ORIGINAL REASON
                            </span>
                            {viewItemModal.moderationCategory && viewItemModal.moderationCategory !== "none" && (
                              <span className="admin-badge neutral" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
                                {viewItemModal.moderationCategory}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "0.86rem", color: "#fca5a5", lineHeight: "1.4", wordBreak: "break-word" }}>
                            {origReason}
                          </span>
                        </div>
                      )}
                      {appealStmt && (
                        <div style={{ background: "rgba(59, 130, 246, 0.09)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "10px 14px", borderRadius: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span className="admin-badge" style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
                              APPEAL STATEMENT
                            </span>
                            {appealStmt.length > 180 && (
                              <button
                                type="button"
                                onClick={() => toggleTextExpanded("modal-appeal-stmt")}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#60a5fa",
                                  fontSize: "0.74rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: "0 2px",
                                }}
                              >
                                {expandedTextMap["modal-appeal-stmt"] ? "Show less" : "Show all"}
                              </button>
                            )}
                          </div>
                          <div
                            style={{
                              maxHeight: expandedTextMap["modal-appeal-stmt"] ? "220px" : "100px",
                              overflowY: "auto",
                              paddingRight: "4px",
                              transition: "max-height 0.2s ease",
                            }}
                          >
                            <p style={{ fontSize: "0.86rem", color: "#e2e8f0", lineHeight: "1.45", margin: 0, fontStyle: "italic", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              "{appealStmt}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                if (viewItemModal.moderationReason) {
                  return (
                    <div style={{ marginTop: "10px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", padding: "10px 14px", borderRadius: "10px", fontSize: "0.85rem", color: "#fca5a5" }}>
                      <strong>Flag Reason:</strong>{" "}
                      {viewItemModal.moderationCategory && viewItemModal.moderationCategory !== "none" && (
                        <span className="admin-badge danger" style={{ marginRight: "6px", fontSize: "0.75rem" }}>
                          {viewItemModal.moderationCategory}
                        </span>
                      )}
                      {viewItemModal.moderationReason.replace(/\s*\|\s*\[AI\]:\s*$/, "")}
                    </div>
                  );
                }

                return null;
              })()}
            </div>
            {viewItemModal.title && (
              <h3 style={{ margin: "4px 0 10px 0", fontSize: "1.05rem", color: "#f8fafc", flexShrink: 0 }}>
                {viewItemModal.title}
              </h3>
            )}
            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#94a3b8", marginBottom: "6px", flexShrink: 0 }}>
              Content Preview
            </div>
            <div
              className="admin-preview-body"
              style={{
                minHeight: "160px",
                maxHeight: "360px",
                flexShrink: 0,
                overflowY: "auto",
                background: "rgba(0,0,0,0.3)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {(() => {
                const rawContent = viewItemModal.body || viewItemModal.text || viewItemModal.contentPreview?.body || viewItemModal.contentPreview?.text;
                if (!rawContent) return <p className="text-muted">No text content.</p>;
                return <MarkdownRenderer content={rawContent} />;
              })()}
            </div>
            <div className="admin-modal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {(viewItemModal.postId || (viewItemModal.itemType === "post" ? (viewItemModal.id || viewItemModal._id) : null)) && (
                  <Link
                    to={`/forum/posts/${viewItemModal.postId || (viewItemModal.itemType === "post" ? (viewItemModal.id || viewItemModal._id) : null)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-secondary-btn"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <ExternalLink size={14} /> Open Post Discussion
                  </Link>
                )}
              </div>
              <button
                type="button"
                className="admin-cancel-btn"
                onClick={() => setViewItemModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESTORE FLAGGED ITEM */}
      {itemToRestore && (
        <div className="admin-modal-overlay" onClick={() => !isRestoringItem && setItemToRestore(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <RotateCcw size={20} className="text-emerald" />
                <span>Restore Flagged {itemToRestore.itemType === "post" ? "Post" : "Comment"}</span>
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setItemToRestore(null)}
                disabled={isRestoringItem}
              >
                <X size={18} />
              </button>
            </div>
            <p className="admin-modal-desc" style={{ marginTop: "6px" }}>
              Are you sure you want to unhide and restore this {itemToRestore.itemType}? It will be made visible to all community members immediately.
            </p>
            {itemToRestore.author?.username && (
              <div className="admin-user-summary-box" style={{ margin: "14px 0" }}>
                <span style={{ fontSize: "0.86rem", color: "#e2e8f0" }}>
                  Author: <strong>@{itemToRestore.author.username}</strong>
                </span>
                {itemToRestore.title && (
                  <span style={{ fontSize: "0.84rem", color: "#94a3b8" }}>
                    Title: <em>{itemToRestore.title}</em>
                  </span>
                )}
              </div>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-btn"
                disabled={isRestoringItem}
                onClick={() => setItemToRestore(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                style={{ background: "#10b981", borderColor: "#10b981" }}
                disabled={isRestoringItem}
                onClick={handleConfirmRestoreItem}
              >
                {isRestoringItem ? "Restoring..." : "Restore Content"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE FLAGGED ITEM */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => {
          if (!isDeletingFlaggedItem) setItemToDelete(null);
        }}
        onConfirm={handleConfirmDeleteFlaggedItem}
        title={`Delete Flagged ${itemToDelete?.itemType === "post" ? "Post" : "Comment"}`}
        description={`Are you sure you want to permanently delete this flagged ${itemToDelete?.itemType || "item"}? This action cannot be undone.`}
        itemTitle={itemToDelete?.title || stripHtml(itemToDelete?.body || "")}
        warningNote={`This will permanently wipe this ${itemToDelete?.itemType || "content"} from the database.`}
        confirmText="Delete Permanently"
        isDeleting={isDeletingFlaggedItem}
      />
    </section>
  );
}
