export function getAuthorBadge(author) {
  if (!author) return null

  const role = (author.role || '').toLowerCase()
  const community = author.communityRole || {}
  const isMember = Boolean(community.isMember)

  if (role === 'admin') {
    return {
      text: 'Admin',
      className: 'role-admin',
      type: 'admin',
    }
  }

  if (role === 'moderator') {
    return {
      text: 'Moderator',
      className: 'role-mod',
      type: 'moderator',
    }
  }

  if (isMember) {
    const label = community.positionTitle || community.category || 'Member'
    return {
      text: label,
      className: 'role-core-member',
      type: 'member',
    }
  }

  return null
}
