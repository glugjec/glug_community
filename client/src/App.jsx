import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import ScrollToTop from './components/common/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Categories from './pages/Categories.jsx'
import TerminalPage from './pages/TerminalPage.jsx'
import Resources from './pages/Resources.jsx'
import Forum from './pages/Forum.jsx'
import Compiler from './pages/compiler/Compiler.jsx'
import PostDetail from './pages/PostDetail.jsx'
import ForYou from './pages/ForYou.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Members from './pages/Members.jsx'
import Chat from './pages/Chat.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import About from './pages/About.jsx'
import Events from './pages/Events.jsx'
import EventDetail from './pages/EventDetail.jsx'
import { Users, Calendar, Info, FileText } from 'lucide-react'

export default function App() {
  const location = useLocation()
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password'

  return (
    <div className="app-container">
      <ScrollToTop />
      {isAuthPage ? (
        <main className="main-content-flush">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </main>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/for-you" element={<ForYou />} />
            <Route path="/feed" element={<ForYou />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/terminal" element={<TerminalPage />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/compiler" element={<Compiler />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/discussions" element={<Forum />} />
            <Route path="/posts" element={<Forum />} />
            <Route path="/forum/posts/:id" element={<PostDetail />} />
            <Route path="/discussions/:id" element={<PostDetail />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/post" element={<PostDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/messages" element={<Chat />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:idOrSlug" element={<EventDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      )}
    </div>
  )
}