import { adminDb } from "../lib/firestore.server";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  slug: string;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

async function getPosts(): Promise<Post[]> {
  // Check if adminDb was initialized before using it.
  if (!adminDb) {
    console.error("Firestore Admin is not initialized. Cannot fetch posts.");
    return []; // Return an empty array to prevent crashing the page.
  }

  const snapshot = await adminDb
    .collection("blogs")
    .orderBy("createdAt", "desc")
    .get();
  const posts: Post[] = [];
  snapshot.forEach((doc) => {
    posts.push({ id: doc.id, ...doc.data() } as Post);
  });
  return posts;
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className='min-h-screen bg-gray-900 text-white p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-5xl font-extrabold mb-8 text-center text-cyan-400'>
          Our Blog
        </h1>
        <div className='space-y-8'>
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <div className='block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition'>
                  <h2 className='text-3xl font-bold text-white'>
                    {post.title}
                  </h2>
                  <p className='text-gray-400 mt-2'>
                    Published on{" "}
                    {new Date(
                      post.createdAt._seconds * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className='text-center text-gray-400'>
              No blog posts found. Come back later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
