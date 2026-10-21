/**
 * Handles unmatched routes with a predictable JSON 404 response.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404
    }
  });
};

export default notFoundHandler;
