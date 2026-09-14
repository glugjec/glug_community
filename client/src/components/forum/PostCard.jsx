import { Link } from 'react-router-dom'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import VoteButtons from './VoteButtons.jsx'
import { Pin, MessageSquare } from 'lucide-react'
import { Pin, MessageSquare, ShieldAlert } from 'lucide-react'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import { getAuthorBadge } from '../../utils/badgeHelper.js'

export default function PostCard({ post, onTagClick }) {
  const authorName = post.author?.username || post.username || 'Anonymous'
  const authorBadge = getAuthorBadge(post.author)
  const postDate = new Date(post.createdAt || post.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className={`post-card ${post.isPinned ? 'pinned' : ''}`}>
      <div className="post-card-inner">
        <VoteButtons
          postId={post.id || post._id}
          initialScore={post.voteScore || 0}
          initialVote={post.userVote || 0}
          orientation="vertical"
        />

        <div className="post-card-main">
          <div className="post-header-line">
            <div className="post-author-badge">
              <div
                className="post-mini-avatar"
                style={{ background: avatarColor(authorName) }}
              >
                {avatarInitials(authorName)}
              </div>
              <span className="post-author-name">@{authorName}</span>
              {authorBadge && (
                <span className={authorBadge.type === 'admin' ? 'admin-badge' : 'admin-badge member-badge'}>
                  {authorBadge.text}
                </span>
              )}
            </div>

            <div className="post-header-badges">
              {post.isHidden && (
                <span className="post-restricted-badge" title="Restricted by moderation">
                  <ShieldAlert size={12} /> Restricted
                </span>
              )}
              {post.isPinned && (
                <span className="pinned-badge" title="Pinned by moderators">
                  <Pin size={13} /> Pinned
                </span>
              )}
              <span className="post-date">{postDate}</span>
            </div>
          </div>

          <Link to={`/forum/posts/${post.id || post._id}`} className="post-title">
            <h2>{post.title}</h2>
          </Link>

          <p className="post-preview">{post.body}</p>

          <div className="post-footer-line">
            <div className="post-tags-container">
              <Chip label={post.category} />
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="post-tag-pill"
                  onClick={(e) => {
                    if (onTagClick) {
                      e.preventDefault()
                      e.stopPropagation()
                      onTagClick(tag)
                    }
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <Link to={`/forum/posts/${post.id || post._id}`} className="post-comment-counter">
              <MessageSquare size={14} />
              <span>{post.commentCount ?? post.comment_count ?? 0} comments</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

