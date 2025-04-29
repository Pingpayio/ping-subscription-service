import fs from "fs";
import path from "path";

/**
 * Service for handling static file operations
 */
export class StaticService {
  /**
   * Get content type for a file
   */
  getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".html":
        return "text/html";
      case ".css":
        return "text/css";
      case ".js":
        return "text/javascript";
      case ".json":
        return "application/json";
      case ".png":
        return "image/png";
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".svg":
        return "image/svg+xml";
      case ".ico":
        return "image/x-icon";
      default:
        return "application/octet-stream";
    }
  }

  /**
   * Read a file and return its content with appropriate content type
   */
  async readFile(
    fullPath: string,
  ): Promise<{ content: Buffer; contentType: string }> {
    const content = await fs.promises.readFile(fullPath);
    const contentType = this.getContentType(fullPath);
    return { content, contentType };
  }

  /**
   * Get the appropriate index.html path based on environment
   */
  getIndexPath(): string {
    return process.env.NODE_ENV === "production"
      ? "./dist/index.html"
      : "./frontend/index.html";
  }
}

// Export singleton instance
export const staticService = new StaticService();
