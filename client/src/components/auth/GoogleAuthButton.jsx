import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { authApi } from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function GoogleAuthButton({ onError, onRequiresUsername }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return
    setLoading(true)
    try {
      const data = await authApi.googleLogin(credentialResponse.credential)
      if (data?.requiresUsername && onRequiresUsername) {
        onRequiresUsername(data)
        return
      }
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      if (onError) onError(err.message, err.data)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    if (onError) onError('Google Sign-In was cancelled or encountered an error.')
  }

  // If Client ID is configured, render official Google Identity Services button
  if (clientId) {
    return (
      <div className="google-auth-wrapper">
        <GoogleOAuthProvider clientId={clientId}>
          <div className="google-btn-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme={typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_black'}
              shape="rectangular"
              size="large"
              text="continue_with"
              width="100%"
            />
          </div>
        </GoogleOAuthProvider>
      </div>
    )
  }

  // Friendly placeholder when VITE_GOOGLE_CLIENT_ID is not yet in .env
  return (
    <div className="google-auth-wrapper">
      <button
        type="button"
        className="google-custom-btn"
        onClick={() => {
          if (onError) {
            onError('To enable Google Sign-In, please add VITE_GOOGLE_CLIENT_ID in client/.env')
          }
        }}
        title="Requires VITE_GOOGLE_CLIENT_ID in client/.env"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93Z"
          />
        </svg>
        <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
      </button>
    </div>
  )
}

