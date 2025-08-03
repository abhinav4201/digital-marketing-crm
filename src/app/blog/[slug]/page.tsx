import { adminDb } from "../../lib/firestore.server";
import { notFound } from "next/navigation";
import MarkdownIt from "markdown-it";
import { Metadata } from "next";

const md = new MarkdownIt();

interface Post {
  title: string;
  content: string;
  svg?: string;
  youtubeId?: string;
  createdAt: {
    _seconds: number;
  };
}

async function getPost(slug: string): Promise<Post | null> {
  if (!adminDb) {
    console.error("Firestore Admin is not initialized. Cannot fetch post.");
    return null;
  }

  const snapshot = await adminDb
    .collection("blogs")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data() as Post;
}

// Dynamic Metadata Function
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return {
      title: "Post Not Found",
      description: "The blog post you are looking for does not exist.",
    };
  }
  return {
    title: `${post.title} | Our Blog`,
    description: post.content.substring(0, 155),
  };
}

// Define PageProps interface for Next.js dynamic route
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const htmlContent = md.render(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: new Date(post.createdAt._seconds * 1000).toISOString(),
    dateModified: new Date(post.createdAt._seconds * 1000).toISOString(),
    description: post.content.substring(0, 155),
    author: {
      "@type": "Organization",
      name: "Royal Screen",
    },
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white p-4 sm:p-8'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className='max-w-4xl mx-auto'>
        <article className='prose prose-sm sm:prose-base prose-invert lg:prose-lg mx-auto'>
          <h1 className='text-3xl sm:text-5xl font-extrabold text-cyan-400'>
            {post.title}
          </h1>
          <p className='text-gray-400 mb-8'>
            Published on{" "}
            {new Date(post.createdAt._seconds * 1000).toLocaleDateString()}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 my-8 not-prose'>
            {post.svg && (
              <div className='bg-gray-800 p-4 rounded-lg flex items-center justify-center'>
                <div
                  className='w-full h-auto'
                  dangerouslySetInnerHTML={{ __html: post.svg }}
                />
              </div>
            )}
            {post.youtubeId && (
              <div className='aspect-w-16 aspect-h-9'>
                <iframe
                  src={`https://www.youtube.com/embed/${post.youtubeId}`}
                  title='YouTube video player'
                  frameBorder='0'
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  allowFullScreen
                  className='w-full h-full rounded-lg'
                ></iframe>
              </div>
            )}
          </div>

          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </article>
      </div>
    </div>
  );
}
