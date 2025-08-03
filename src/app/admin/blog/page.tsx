"use client";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useInfoModalStore } from "../../store/useInfoModalStore";

const CreateBlogPage = () => {
  const { role } = useAuth(); // UPDATED: Using role instead of isAdmin
  const { openModal: openInfoModal } = useInfoModalStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [svg, setSvg] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSlug(createSlug(e.target.value));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSvg(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // UPDATED: Authorization check
    if (role !== "admin") {
      openInfoModal(
        "Authorization Error",
        "You are not authorized to create a blog post."
      );
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "blogs"), {
        title,
        content,
        slug,
        svg,
        youtubeId,
        createdAt: serverTimestamp(),
      });
      openInfoModal("Success", "Blog post created successfully!");
      // Reset form
      setTitle("");
      setContent("");
      setSlug("");
      setSvg("");
      setYoutubeId("");
    } catch (error) {
      console.error("Error adding document: ", error);
      openInfoModal("Error", "There was a problem creating the post.");
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATED: Authorization check
  if (role !== "admin") {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>
          You are not authorized to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='bg-white p-6 rounded-lg shadow-md mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>
            Create New Blog Post
          </h1>
          <p className='text-gray-500 mt-2'>
            Craft and publish a new article for your audience.
          </p>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Form Section */}
          <div className='lg:col-span-2 bg-white p-6 rounded-lg shadow-md'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label
                  htmlFor='title'
                  className='block text-sm font-medium text-gray-700'
                >
                  Title
                </label>
                <input
                  type='text'
                  id='title'
                  value={title}
                  onChange={handleTitleChange}
                  required
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
              <div>
                <label
                  htmlFor='slug'
                  className='block text-sm font-medium text-gray-700'
                >
                  Slug (auto-generated)
                </label>
                <input
                  type='text'
                  id='slug'
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className='mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-3'
                  readOnly
                />
              </div>
              <div>
                <label
                  htmlFor='svg'
                  className='block text-sm font-medium text-gray-700'
                >
                  SVG Image (Optional)
                </label>
                <input
                  type='file'
                  id='svg'
                  onChange={handleFileChange}
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500'
                  accept='.svg'
                />
              </div>
              <div>
                <label
                  htmlFor='youtubeId'
                  className='block text-sm font-medium text-gray-700'
                >
                  YouTube Video ID (Optional)
                </label>
                <input
                  type='text'
                  id='youtubeId'
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='e.g., dQw4w9WgXcQ'
                />
              </div>
              <div>
                <label
                  htmlFor='content'
                  className='block text-sm font-medium text-gray-700'
                >
                  Content (Markdown supported)
                </label>
                <textarea
                  id='content'
                  rows={15}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500'
                ></textarea>
              </div>
              <div>
                <button
                  type='submit'
                  disabled={submitting}
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500'
                >
                  {submitting ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>

          {/* Markdown Cheat Sheet */}
          <div className='lg:col-span-1 bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              Markdown Cheat Sheet
            </h2>
            <div className='space-y-4 text-sm text-gray-600'>
              <div>
                <h3 className='font-semibold'>Headings</h3>
                <p>
                  <code># H1</code>, <code>## H2</code>, <code>### H3</code>
                </p>
              </div>
              <div>
                <h3 className='font-semibold'>Text Styles</h3>
                <p>
                  <code>**bold**</code>, <code>*italic*</code>,{" "}
                  <code>~~strike~~</code>
                </p>
              </div>
              <div>
                <h3 className='font-semibold'>Lists</h3>
                <p>
                  <code>- Item 1</code> or <code>1. Item 1</code>
                </p>
              </div>
              <div>
                <h3 className='font-semibold'>Links</h3>
                <p>
                  <code>[Link Text](https://example.com)</code>
                </p>
              </div>
              <div>
                <h3 className='font-semibold'>Images</h3>
                <p>
                  <code>![Alt Text](image_url.jpg)</code>
                </p>
              </div>
              <div>
                <h3 className='font-semibold'>Code</h3>
                <p>
                  # My First Blog Post This is my very first post! <br />
                  I&apos;m **really excited** to share it. <br />
                  Here are a few things I&apos;ll be writing about: <br />
                  - Web Development
                  <br /> - Digital Marketing
                  <br /> - Design Trends <br />
                  Stay tuned for more updates. You can visit our main site
                  [here](https://www.royalscreen.com).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogPage;
