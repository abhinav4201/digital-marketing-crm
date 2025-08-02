"use client";
import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
      <div className='max-w-4xl mx-auto'>
        <header className='bg-white p-6 rounded-lg shadow-md mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>
            Create New Blog Post
          </h1>
          <p className='text-gray-500 mt-2'>
            Craft and publish a new article for your audience.
          </p>
        </header>

        <div className='bg-white p-6 rounded-lg shadow-md'>
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
                SVG Image Code (Optional)
              </label>
              <input
                type='url'
                id='svg'
                value={svg}
                onChange={(e) => setSvg(e.target.value)}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500'
                placeholder='https://your-domain.com/image.svg'
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
      </div>
    </div>
  );
};

export default CreateBlogPage;
