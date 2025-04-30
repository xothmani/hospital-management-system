const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (req.user.role !== role) {
      res.status(403);
      throw new Error('Not authorized for this role');
    }

    next();
  };
};

module.exports = { checkRole }; 