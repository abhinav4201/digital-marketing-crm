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
  if (!adminDb) {
    console.error("Firestore Admin is not initialized. Cannot fetch posts.");
    return [];
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
    <div className='min-h-screen bg-gray-100 text-gray-900 p-8'>
      <div className='max-w-4xl mx-auto'>
        <header className='text-center mb-12'>
          <h1 className='text-5xl font-extrabold text-blue-600'>Our Blog</h1>
          <p className='mt-4 text-lg text-gray-600'>
            Insights, news, and updates from our team.
          </p>
        </header>
        <div className='space-y-8'>
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <div className='block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200'>
                  <h2 className='text-3xl font-bold text-gray-900'>
                    {post.title}
                  </h2>
                  <p className='text-gray-500 mt-2'>
                    Published on{" "}
                    {new Date(
                      post.createdAt._seconds * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className='text-center bg-white p-10 rounded-lg shadow-md'>
              <h3 className='text-xl font-bold text-gray-900'>No Posts Yet</h3>
              <p className='mt-2 text-gray-600'>
                There are no blog posts to display right now. Please check back
                later!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
