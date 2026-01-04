function requireRole(...allowed) {
  return function (req, res, next) {
    const role = (req.user && req.user.role) || null;
    if (!role) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (allowed.includes(role) || allowed.includes('any')) return next();
    return res.status(403).json({ success: false, error: `Forbidden: insufficient role. Required: ${allowed.join(' or ')}, Got: ${role}` });
  };
}

module.exports = { requireRole };
