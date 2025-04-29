import { Hono } from "hono";
import path from "path";
import { staticService } from "../services/static.js";

// Create router instance
const router = new Hono();

/**
 * Serve static files from the public directory
 */
router.get("/public/*", async (c) => {
  try {
    const filePath = c.req.path.replace("/public/", "");
    const fullPath = path.join("./public", filePath);
    const { content, contentType } = await staticService.readFile(fullPath);

    return new Response(content, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (e) {
    return c.notFound();
  }
});

/**
 * Serve static files from the dist directory (Vite build output)
 */
router.get("/assets/*", async (c) => {
  try {
    const filePath = c.req.path.replace("/assets/", "");
    const fullPath = path.join("./dist/assets", filePath);
    const { content, contentType } = await staticService.readFile(fullPath);

    return new Response(content, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (e) {
    return c.notFound();
  }
});

/**
 * Root route - serve the index.html file
 */
router.get("/", async (c) => {
  try {
    const indexPath = staticService.getIndexPath();
    const { content } = await staticService.readFile(indexPath);

    return new Response(content, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error serving index.html:", error);
    return c.text("Error loading page", 500);
  }
});

/**
 * Catch-all route for SPA routing - serve index.html for any unmatched routes
 */
router.get("*", async (c) => {
  // Skip API routes and asset routes
  const path = c.req.path;
  if (
    path.startsWith("/api/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/public/")
  ) {
    return c.notFound();
  }

  try {
    const indexPath = staticService.getIndexPath();
    const { content } = await staticService.readFile(indexPath);

    return new Response(content, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error serving index.html for SPA route:", error);
    return c.notFound();
  }
});

export default router;
