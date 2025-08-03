import { MetadataRoute } from "next";
import { adminDb } from "./lib/firestore.server";

interface Post {
  slug: string;
  createdAt: {
    _seconds: number;
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://royal-screen.vercel.app/"; // Replace with your actual domain

  if (!adminDb) {
    console.error(
      "Firestore Admin is not initialized. Cannot generate sitemap."
    );
    // Return a minimal sitemap or an empty array if the database is not available
    return [
      { url: baseUrl, lastModified: new Date().toISOString() },
      { url: `${baseUrl}/blog`, lastModified: new Date().toISOString() },
    ];
  }

  // Get all blog posts from Firestore
  const postsSnapshot = await adminDb
    .collection("blogs")
    .orderBy("createdAt", "desc")
    .get();
  const blogPosts = postsSnapshot.docs.map((doc) => {
    const data = doc.data() as Post;
    return {
      url: `${baseUrl}/blog/${data.slug}`,
      lastModified: new Date(data.createdAt._seconds * 1000).toISOString(),
    };
  });

  // Add your static pages
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date().toISOString() },
    { url: `${baseUrl}/blog`, lastModified: new Date().toISOString() },
    // Add other static pages here
  ];

  return [...staticRoutes, ...blogPosts];
}
