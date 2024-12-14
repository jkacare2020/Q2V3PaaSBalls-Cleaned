module.exports = (allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user["http://your-app/roles"] || []; // Adjust the namespace based on Auth0 configuration
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }

    next();
  };
};
